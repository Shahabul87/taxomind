"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Users, MessageCircle, Calendar, ArrowUpRight, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface EnterpriseGroupCardProps {
  group: GroupData;
  index?: number;
  variant?: "grid" | "list";
}

// 3D tilt effect hook
function useTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { rotateX, rotateY, handleMouseMove, handleMouseLeave };
}

// Activity indicator showing group engagement
function ActivityIndicator({ members }: { members: number }) {
  const activity = members > 100 ? "high" : members > 30 ? "medium" : "low";
  const colors = {
    high: "bg-emerald-500",
    medium: "bg-amber-500",
    low: "bg-slate-400",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          colors[activity],
          activity === "high" && "animate-pulse"
        )}
      />
      <span className="text-xs text-[hsl(var(--groups-text-subtle))] capitalize">
        {activity} activity
      </span>
    </div>
  );
}

export function EnterpriseGroupCard({
  group,
  index = 0,
  variant = "grid",
}: EnterpriseGroupCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { rotateX, rotateY, handleMouseMove, handleMouseLeave } = useTilt();

  // Calculate delay for staggered animation
  const entranceDelay = Math.min(index * 0.05, 0.3);

  if (variant === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: entranceDelay }}
      >
        <Link href={`/groups/${group.id}`} className="block">
          <div
            className={cn(
              "groups-card-glow flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-xl",
              "bg-[hsl(var(--groups-surface-elevated))]",
              "border border-[hsl(var(--groups-border))]",
              "transition-all duration-300"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Image */}
            <div className="relative w-full sm:w-48 h-32 sm:h-36 rounded-lg overflow-hidden flex-shrink-0">
              {group.imageUrl ? (
                <Image
                  src={group.imageUrl}
                  alt={group.name}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-500",
                    isHovered && "scale-105"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    "bg-gradient-to-br from-[hsl(var(--groups-primary-muted))] to-[hsl(var(--groups-accent-muted))]"
                  )}
                >
                  <Users className="w-12 h-12 text-[hsl(var(--groups-primary))] opacity-40" />
                </div>
              )}
              {/* Privacy indicator */}
              <div className="absolute top-2 left-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                    "bg-black/60 backdrop-blur-sm text-white"
                  )}
                >
                  {group.isPrivate ? (
                    <>
                      <Lock className="w-3 h-3" /> Private
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3" /> Public
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                <h3
                  className={cn(
                    "text-lg sm:text-xl font-semibold text-[hsl(var(--groups-text))]",
                    "line-clamp-1 transition-colors duration-300",
                    isHovered && "text-[hsl(var(--groups-primary))]"
                  )}
                >
                  {group.name}
                </h3>
                {group.category && (
                  <span className="groups-badge px-2.5 py-1 rounded-full text-xs font-semibold self-start">
                    {group.category}
                  </span>
                )}
              </div>

              <p className="text-sm text-[hsl(var(--groups-text-muted))] mb-3 line-clamp-2 leading-relaxed">
                {group.description || "No description available"}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-auto text-sm text-[hsl(var(--groups-text-subtle))]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[hsl(var(--groups-primary))]" />
                  <span className="font-medium">{group._count.members}</span>
                  <span>members</span>
                </div>
                <ActivityIndicator members={group._count.members} />
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                  className="ml-auto inline-flex items-center gap-1 text-[hsl(var(--groups-primary))] font-medium"
                >
                  View Group
                  <ArrowUpRight className="w-4 h-4" />
                </motion.span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid variant with 3D tilt
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: entranceDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        perspective: 1000,
      }}
    >
      <Link href={`/groups/${group.id}`} className="block">
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={(e) => {
            handleMouseLeave();
            setIsHovered(false);
          }}
          onMouseEnter={() => setIsHovered(true)}
          className={cn(
            "groups-card-glow rounded-2xl overflow-hidden",
            "bg-[hsl(var(--groups-surface-elevated))]",
            "border border-[hsl(var(--groups-border))]",
            "h-full flex flex-col",
            "transform-gpu will-change-transform"
          )}
        >
          {/* Image section */}
          <div className="relative h-44 overflow-hidden">
            {group.imageUrl ? (
              <Image
                src={group.imageUrl}
                alt={group.name}
                fill
                className={cn(
                  "object-cover transition-transform duration-700",
                  isHovered && "scale-110"
                )}
              />
            ) : (
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  "bg-gradient-to-br from-[hsl(var(--groups-primary-muted))] via-[hsl(var(--groups-secondary-muted))] to-[hsl(var(--groups-accent-muted))]"
                )}
              >
                <motion.div
                  animate={{
                    scale: isHovered ? 1.1 : 1,
                    rotate: isHovered ? 5 : 0,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <Users className="w-16 h-16 text-[hsl(var(--groups-primary))] opacity-30" />
                </motion.div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Category badge */}
            {group.category && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 right-3"
              >
                <span
                  className={cn(
                    "groups-badge px-3 py-1.5 rounded-full text-xs font-semibold",
                    "backdrop-blur-sm shadow-lg"
                  )}
                >
                  {group.category}
                </span>
              </motion.div>
            )}

            {/* Privacy & member count overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                  "bg-black/50 backdrop-blur-sm text-white"
                )}
              >
                {group.isPrivate ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                {group.isPrivate ? "Private" : "Public"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                  "bg-black/50 backdrop-blur-sm text-white"
                )}
              >
                <Users className="w-3 h-3" />
                {group._count.members}
              </span>
            </div>
          </div>

          {/* Content section */}
          <div className="p-5 flex-1 flex flex-col">
            <h3
              className={cn(
                "text-lg font-semibold text-[hsl(var(--groups-text))] mb-2",
                "line-clamp-1 transition-colors duration-300",
                isHovered && "text-[hsl(var(--groups-primary))]"
              )}
            >
              {group.name}
            </h3>

            <p className="text-sm text-[hsl(var(--groups-text-muted))] mb-4 line-clamp-2 flex-1 leading-relaxed">
              {group.description || "Join this community to connect with like-minded learners."}
            </p>

            {/* Footer */}
            <div
              className={cn(
                "flex items-center justify-between pt-4",
                "border-t border-[hsl(var(--groups-border-subtle))]"
              )}
            >
              <ActivityIndicator members={group._count.members} />

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isHovered ? 1 : 0.6,
                  scale: isHovered ? 1 : 0.9,
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold",
                  "bg-[hsl(var(--groups-primary))] text-[hsl(var(--groups-primary-foreground))]",
                  "transition-all duration-300"
                )}
              >
                Explore
                <ArrowUpRight className="w-3.5 h-3.5" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Trending group card (compact variant)
export function TrendingGroupCard({
  group,
  index = 0,
}: {
  group: GroupData;
  index?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/groups/${group.id}`}>
        <div
          className={cn(
            "groups-feature-card rounded-xl p-4 h-full flex flex-col",
            "transition-all duration-300"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Avatar */}
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3",
              "bg-gradient-to-br from-[hsl(var(--groups-primary-muted))] to-[hsl(var(--groups-accent-muted))]",
              "transition-transform duration-300",
              isHovered && "scale-110"
            )}
          >
            {group.imageUrl ? (
              <Image
                src={group.imageUrl}
                alt={group.name}
                width={48}
                height={48}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Users
                className={cn(
                  "w-6 h-6 text-[hsl(var(--groups-primary))]",
                  "transition-all duration-300",
                  isHovered && "scale-110"
                )}
              />
            )}
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-semibold text-sm text-[hsl(var(--groups-text))] mb-1 line-clamp-1",
              "transition-colors duration-300",
              isHovered && "text-[hsl(var(--groups-primary))]"
            )}
          >
            {group.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-[hsl(var(--groups-text-muted))] mb-3 line-clamp-2 flex-1 leading-relaxed">
            {group.description || "A learning community"}
          </p>

          {/* Category badge */}
          {group.category && (
            <span className="groups-badge px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2 self-start">
              {group.category}
            </span>
          )}

          {/* Member count */}
          <div className="flex items-center gap-1 text-xs text-[hsl(var(--groups-primary))] font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{group._count.members} members</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
