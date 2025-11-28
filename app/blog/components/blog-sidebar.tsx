"use client";

import Link from "next/link";
import {  TrendingUp, User, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BlogPost } from "./types";

interface TrendingSidebarProps {
  posts: BlogPost[];
}

/**
 * Trending Sidebar Component
 * Displays top 5 trending blog posts
 */
export function TrendingSidebar({ posts }: TrendingSidebarProps) {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500"
  ];

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Now
          </h3>
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-md">
            Hot
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
          {posts.slice(0, 5).map((post, index) => (
            <li key={post.id}>
              <Link href={`/blog/${post.id}`} aria-label={`Read: ${post.title}`}>
                <div className="px-5 py-4 group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-200">
                  <div className="flex gap-4 items-start">
                    {/* Gradient Number Badge */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[index]} text-white flex items-center justify-center font-bold text-lg shadow-lg`}>
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 leading-tight">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.user.name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
