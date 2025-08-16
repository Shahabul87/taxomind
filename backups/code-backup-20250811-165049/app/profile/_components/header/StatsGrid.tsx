"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Users, Heart, MessageCircle, FileText, 
  DollarSign, Video, Star, Crown
} from "lucide-react";

interface UserStats {
  followers: number;
  following: number;
  likes: number;
  posts: number;
  comments: number;
  subscriptions: number;
  monthlySpending: number;
  content: number;
  ideas: number;
  courses: number;
}

interface StatsGridProps {
  stats: UserStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statsCards = [
    {
      label: "Followers",
      value: stats.followers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      change: "+12%"
    },
    {
      label: "Following",
      value: stats.following,
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      change: "+8%"
    },
    {
      label: "Posts",
      value: stats.posts,
      icon: FileText,
      color: "from-purple-500 to-indigo-500",
      change: "+15%"
    },
    {
      label: "Likes",
      value: stats.likes,
      icon: Star,
      color: "from-amber-500 to-orange-500",
      change: "+23%"
    },
    {
      label: "Comments",
      value: stats.comments,
      icon: MessageCircle,
      color: "from-green-500 to-emerald-500",
      change: "+18%"
    },
    {
      label: "Content",
      value: stats.content,
      icon: Video,
      color: "from-red-500 to-pink-500",
      change: "+7%"
    },
    {
      label: "Subscriptions",
      value: stats.subscriptions,
      icon: Crown,
      color: "from-yellow-500 to-amber-500",
      change: "Active"
    },
    {
      label: "Monthly Spend",
      value: `$${stats.monthlySpending.toFixed(0)}`,
      icon: DollarSign,
      color: "from-emerald-500 to-green-500",
      change: "-5%"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-fade-in-up">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="relative overflow-hidden bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="p-4 text-center space-y-2">
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110",
                  stat.color
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-slate-300 font-medium">{stat.label}</p>
                  <p className={cn(
                    "text-xs font-semibold",
                    stat.change.startsWith('+') ? "text-green-400" :
                    stat.change.startsWith('-') ? "text-red-400" : "text-blue-400"
                  )}>
                    {stat.change}
                  </p>
                </div>
              </div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -left-4 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
            </Card>
          </div>
        );
      })}
    </div>
  );
} 