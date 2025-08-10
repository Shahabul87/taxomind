"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLink } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, PieChart, AlertTriangle } from "lucide-react";
import { SocialDataCard } from "../social/SocialDataCard";
import axios from "axios";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface AnimatedHeaderProps {
  userId: string;
  username?: string;
  avatarUrl?: string;
  joinDate?: string;
  profileLinks?: ProfileLink[];
}

// Sample data for social media visualization (fallback when API fails)
const sampleEngagementData = {
  facebook: {
    name: "Facebook",
    followers: 1240,
    engagement: 22,
    growth: 5.2,
    posts: 47,
    likes: 3280,
    shares: 452,
    comments: 721,
    recentActivity: [65, 59, 80, 81, 56, 55, 72, 68, 74, 59, 62, 88],
    audienceDemo: { male: 42, female: 58 },
    topPosts: [
      { title: "Product Launch", engagement: 12.4, date: "2023-08-15" },
      { title: "Company Update", engagement: 8.7, date: "2023-09-02" },
      { title: "Industry News", engagement: 7.2, date: "2023-09-22" }
    ]
  },
  twitter: {
    name: "Twitter",
    followers: 860,
    engagement: 15,
    growth: -1.3,
    posts: 128,
    likes: 2450,
    shares: 1240,
    comments: 320,
    recentActivity: [28, 48, 40, 19, 86, 27, 90, 65, 59, 80, 81, 56],
    audienceDemo: { male: 61, female: 39 },
    topPosts: [
      { title: "Tech Industry Poll", engagement: 18.7, date: "2023-08-28" },
      { title: "Product Feature", engagement: 14.2, date: "2023-09-12" },
      { title: "Company Milestone", engagement: 9.8, date: "2023-09-30" }
    ]
  },
  instagram: {
    name: "Instagram",
    followers: 3120,
    engagement: 28,
    growth: 12.8,
    posts: 82,
    likes: 8720,
    shares: 1820,
    comments: 2150,
    recentActivity: [41, 92, 64, 75, 42, 56, 63, 75, 86, 41, 75, 92],
    audienceDemo: { male: 32, female: 68 },
    topPosts: [
      { title: "Product Showcase", engagement: 24.3, date: "2023-08-18" },
      { title: "Behind the Scenes", engagement: 22.1, date: "2023-09-05" },
      { title: "Customer Spotlight", engagement: 19.5, date: "2023-09-25" }
    ]
  }
};

export function AnimatedHeader({ userId, username, avatarUrl, joinDate, profileLinks = [] }: AnimatedHeaderProps) {
  const [socialInsights, setSocialInsights] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [platformData, setPlatformData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  
  // Use refs to track values without triggering re-renders
  const platformDataRef = useRef(platformData);
  const loadingRef = useRef(loading);
  
  // Keep refs updated with latest values
  useEffect(() => {
    platformDataRef.current = platformData;
  }, [platformData]);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Extract connected platforms from profileLinks
  useEffect(() => {
    if (profileLinks?.length) {
      const platforms = profileLinks.map(link => {
        const platform = link.platform.toLowerCase();
        if (platform.includes('facebook')) return 'facebook';
        if (platform.includes('twitter') || platform.includes('x.com')) return 'twitter';
        if (platform.includes('instagram')) return 'instagram';
        return platform;
      });
      
      const uniquePlatforms = Array.from(new Set(platforms));
      setConnectedPlatforms(uniquePlatforms);
      
      // If we have connected platforms, show social insights
      if (uniquePlatforms.length > 0) {
        setSocialInsights(true);
        
        // Initialize loading and data states for each platform
        const initialLoading: Record<string, boolean> = {};
        uniquePlatforms.forEach(platform => {
          initialLoading[platform] = false;
        });
        setLoading(initialLoading);
      }
    }
  }, [profileLinks]);

  // Fetch real data for each connected platform
  useEffect(() => {
    const fetchPlatformData = async () => {
      // For each connected platform, fetch data 
      for (const platform of connectedPlatforms) {
        // Skip if we've already loaded this platform's data
        if (platformDataRef.current[platform] || loadingRef.current[platform]) continue;
        
        try {
          setLoading(prev => ({ ...prev, [platform]: true }));
          setError(prev => ({ ...prev, [platform]: '' }));
          
          // For now, use sample data for all platforms
          // This is a safer approach until we implement robust API connectivity
          setPlatformData(prev => ({
            ...prev,
            [platform]: sampleEngagementData[platform as keyof typeof sampleEngagementData] || {
              name: platform.charAt(0).toUpperCase() + platform.slice(1),
              followers: 0,
              engagement: 0,
              growth: 0,
              posts: 0,
              likes: 0,
              shares: 0,
              comments: 0,
              recentActivity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              audienceDemo: { male: 50, female: 50 },
              topPosts: []
            }
          }));
          
          // For demonstration purposes, simulate different states for different platforms
          if (platform === 'facebook') {
            setError(prev => ({
              ...prev,
              [platform]: 'Using demo data. Connect your account for real metrics.'
            }));
          }
        } catch (error) {
          logger.error(`Error setting up data for ${platform}:`, error);
          // Always use fallback data on any error
          setPlatformData(prev => ({
            ...prev,
            [platform]: sampleEngagementData[platform as keyof typeof sampleEngagementData] || {
              name: platform.charAt(0).toUpperCase() + platform.slice(1)
            }
          }));
          
          setError(prev => ({
            ...prev,
            [platform]: 'Could not load platform data'
          }));
        } finally {
          setLoading(prev => ({ ...prev, [platform]: false }));
        }
      }
    };

    if (connectedPlatforms.length > 0) {
      fetchPlatformData();
    }
  }, [connectedPlatforms]); // Only depend on connectedPlatforms
  
  return (
    <div className="w-full">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <ProfileHeader
          userId={userId}
          username={username}
          avatarUrl={avatarUrl}
          joinDate={joinDate}
          profileLinks={profileLinks}
        />
      </motion.div>
      
      {/* Social Media Analytics Dashboard */}
      <AnimatePresence>
        {socialInsights && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 sm:mt-6 md:mt-8 w-full"
          >
            <Card className="bg-slate-800 shadow-md border-slate-700 w-full overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <span className="text-base sm:text-lg md:text-xl text-white">Social Media Performance</span>
                  <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-auto">
                      <TabsList className="grid grid-cols-3 w-auto min-w-[280px] bg-slate-700/50">
                        <TabsTrigger value="overview" className="flex items-center gap-1.5 data-[state=active]:bg-slate-900 text-xs sm:text-sm text-slate-300 data-[state=active]:text-white">
                          <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="engagement" className="flex items-center gap-1.5 data-[state=active]:bg-slate-900 text-xs sm:text-sm text-slate-300 data-[state=active]:text-white">
                          <BarChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Engagement</span>
                        </TabsTrigger>
                        <TabsTrigger value="growth" className="flex items-center gap-1.5 data-[state=active]:bg-slate-900 text-xs sm:text-sm text-slate-300 data-[state=active]:text-white">
                          <LineChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Growth</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-3 sm:p-4 md:p-6 w-full bg-slate-800">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
                  {/* Render connected platform data cards */}
                  {connectedPlatforms.map(platform => {
                    // If loading, show loader
                    if (loading[platform]) {
                      return (
                        <Card key={`social-card-${platform}-loading`} className="p-6 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mx-auto mb-2"></div>
                            <p className="text-sm text-slate-400">Loading {platform} data...</p>
                          </div>
                        </Card>
                      );
                    }
                    
                    // If we have an error but no data, show error
                    if (error[platform] && !platformData[platform]) {
                      return (
                        <Card key={`social-card-${platform}-error`} className="p-6">
                          <div className="text-center">
                            <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-300">Error: {error[platform]}</p>
                          </div>
                        </Card>
                      );
                    }
                    
                    // Get platform data
                    const data = platformData[platform];
                    if (!data) return null;
                    
                    // Show the data card
                    return (
                      <SocialDataCard
                        key={`social-card-${platform}`}
                        platform={platform}
                        data={data}
                        dataType={selectedTab}
                      />
                    );
                  })}
                  
                  {/* Show message if no platforms or data */}
                  {connectedPlatforms.length === 0 && (
                    <div className="col-span-full p-4 sm:p-6 md:p-8 text-center bg-slate-900 rounded-lg">
                      <p className="text-purple-400 text-sm sm:text-base">
                        Connect your social media accounts to see performance analytics
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 