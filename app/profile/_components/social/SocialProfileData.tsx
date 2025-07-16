"use client";

import { useState, useEffect } from "react";
import { ProfileLink } from "@prisma/client";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BarChart3 } from "lucide-react";
import { ProfileMetadataExtractor } from "./ProfileMetadataExtractor";

interface ProfileMetrics {
  platform: string;
  followers: number;
  engagement: number;
  growth: number;
}

export function SocialProfileData() {
  const { data: session } = useSession();
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [metrics, setMetrics] = useState<ProfileMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileLinks = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/profile/links");
        setProfileLinks(response.data);
        
        // Simulate fetching metrics data for each platform
        // In a real implementation, you would call your social media APIs here
        if (response.data.length > 0) {
          const mockMetrics = response.data.map((link: ProfileLink) => ({
            platform: link.platform,
            followers: Math.floor(Math.random() * 5000) + 100,
            engagement: Math.floor(Math.random() * 15) + 1,
            growth: Math.floor(Math.random() * 30) - 10
          }));
          setMetrics(mockMetrics);
        }
      } catch (error) {
        console.error("Failed to fetch profile links:", error);
        setError("Failed to load social profile data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProfileLinks();
    }
  }, [session]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Social Metrics
          </CardTitle>
          <CardDescription>Performance data from your connected platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (profileLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Social Metrics
          </CardTitle>
          <CardDescription>Connect social platforms to see metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You haven&apos;t connected any social platforms yet. Add platforms to see your metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Metadata Extractor */}
      <ProfileMetadataExtractor 
        profileLinks={profileLinks}
        onMetadataUpdated={(metadata) => {
          // Update metrics with real extracted data
          const realMetrics = metadata.filter(m => !m.error).map(m => ({
            platform: m.platform,
            followers: m.followerCount || 0,
            engagement: Math.floor(Math.random() * 15) + 1, // Mock for now
            growth: Math.floor(Math.random() * 30) - 10 // Mock for now
          }));
          if (realMetrics.length > 0) {
            setMetrics(realMetrics);
          }
        }}
      />

      {/* Original Social Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Social Metrics
          </CardTitle>
          <CardDescription>Performance data from your connected platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getPlatformIcon(metric.platform)}
                  </div>
                  <div>
                    <h3 className="font-medium">{metric.platform}</h3>
                    <p className="text-xs text-gray-500">{metric.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${metric.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.growth >= 0 ? '+' : ''}{metric.growth}%
                  </div>
                  <p className="text-xs text-gray-500">{metric.engagement}% engagement</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPlatformIcon(platform: string) {
  const lowercasePlatform = platform.toLowerCase();
  
  if (lowercasePlatform.includes("twitter") || lowercasePlatform.includes("x")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400" fill="currentColor">
      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
    </svg>;
  } else if (lowercasePlatform.includes("facebook")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>;
  } else if (lowercasePlatform.includes("instagram")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-pink-500" fill="currentColor">
      <path d="M12 2a10 10 0 00-10 10v0a10 10 0 0010 10 10 10 0 0010-10 10 10 0 00-10-10z M16.5 0h-9A7.5 7.5 0 000 7.5v9A7.5 7.5 0 007.5 24h9a7.5 7.5 0 007.5-7.5v-9A7.5 7.5 0 0016.5 0zm5.25 16.5a5.25 5.25 0 01-5.25 5.25h-9a5.25 5.25 0 01-5.25-5.25v-9A5.25 5.25 0 017.5 2.25h9a5.25 5.25 0 015.25 5.25v9z M12 6a6 6 0 100 12 6 6 0 000-12zm0 9.75a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5z M18.75 5.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" />
    </svg>;
  } else if (lowercasePlatform.includes("linkedin")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-700" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>;
  } else if (lowercasePlatform.includes("github")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-900 dark:text-white" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>;
  } else if (lowercasePlatform.includes("youtube")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>;
  } else if (lowercasePlatform.includes("tiktok")) {
    return <svg viewBox="0 0 24 24" className="w-5 h-5 text-black dark:text-white" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>;
  }
  
  // Default icon for other platforms
  return <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>;
} 