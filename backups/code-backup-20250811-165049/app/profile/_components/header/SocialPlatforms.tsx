"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialAccount {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  followerCount?: number;
}

interface SocialPlatformsProps {
  socialMediaAccounts: SocialAccount[];
}

export function SocialPlatforms({ socialMediaAccounts }: SocialPlatformsProps) {
  if (socialMediaAccounts.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in-up delay-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Connected Platforms
        </h3>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
          View All
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {socialMediaAccounts.slice(0, 5).map((account, index) => (
          <div
            key={account.id}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            style={{ animationDelay: `${400 + index * 100}ms` }}
          >
            <div className={cn(
              "w-4 h-4 rounded-full",
              account.platform === 'TWITTER' ? "bg-blue-400" :
              account.platform === 'FACEBOOK' ? "bg-blue-600" :
              account.platform === 'INSTAGRAM' ? "bg-pink-500" :
              account.platform === 'LINKEDIN' ? "bg-blue-700" :
              account.platform === 'YOUTUBE' ? "bg-red-500" :
              account.platform === 'TIKTOK' ? "bg-black" :
              "bg-gray-500"
            )} />
            <span className="text-sm text-white font-medium">
              {account.username || account.displayName}
            </span>
            <Badge variant="secondary" className="text-xs bg-white/20 text-slate-200 border-none">
              {(account.followerCount || 0).toLocaleString()}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
} 