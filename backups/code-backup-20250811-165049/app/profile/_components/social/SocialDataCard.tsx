"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Twitter, Instagram, TrendingUp, TrendingDown, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SocialDataCardProps {
  platform: string;
  data: {
    name: string;
    followers: number;
    engagement: number;
    growth: number;
    posts: number;
    likes: number;
    shares: number;
    comments: number;
    recentActivity: number[];
    audienceDemo: { male: number; female: number };
    topPosts: Array<{ title: string; engagement: number; date: string }>;
  };
  dataType: string;
}

export function SocialDataCard({ platform, data, dataType }: SocialDataCardProps) {
  // Platform-specific styling
  const getPlatformStyles = () => {
    switch (platform) {
      case 'facebook':
        return {
          icon: Facebook,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          lightBg: "bg-blue-50"
        };
      case 'twitter':
        return {
          icon: Twitter,
          color: "text-blue-400",
          bgColor: "bg-blue-100",
          lightBg: "bg-blue-50"
        };
      case 'instagram':
        return {
          icon: Instagram,
          color: "text-pink-500",
          bgColor: "bg-pink-100",
          lightBg: "bg-pink-50"
        };
      default:
        return {
          icon: TrendingUp,
          color: "text-purple-500",
          bgColor: "bg-purple-100",
          lightBg: "bg-purple-50"
        };
    }
  };

  const platformStyles = getPlatformStyles();
  const PlatformIcon = platformStyles.icon;
  
  // Chart representation of recent activity
  const renderActivityChart = () => {
    const maxValue = Math.max(...data.recentActivity);
    return (
      <div className="flex items-end h-12 gap-px mt-2">
        {data.recentActivity.map((value, index) => {
          // Calculate height percentage based on max value
          const heightPercentage = (value / maxValue) * 100;
          return (
            <div 
              key={index}
              className={cn(
                "flex-1 rounded-t",
                value > maxValue * 0.7 ? platformStyles.bgColor : platformStyles.lightBg
              )}
              style={{ height: `${heightPercentage}%` }}
              title={`Period ${index + 1}: ${value}`}
            />
          );
        })}
      </div>
    );
  };
  
  // Render audience demographic visualization
  const renderAudienceDemo = () => {
    const { male, female } = data.audienceDemo;
    return (
      <div className="space-y-2 mt-3">
        <div className="flex items-center justify-between text-xs">
          <span>Male</span>
          <span>{male}%</span>
        </div>
        <Progress value={male} className={cn("h-2", platformStyles.bgColor)} />
        
        <div className="flex items-center justify-between text-xs mt-2">
          <span>Female</span>
          <span>{female}%</span>
        </div>
        <Progress value={female} className={cn("h-2", platformStyles.bgColor)} />
      </div>
    );
  };

  // Render top posts for engagement visualization
  const renderTopPosts = () => {
    return (
      <div className="space-y-2.5 mt-3">
        {data.topPosts.map((post, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", platformStyles.bgColor)} />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{post.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{new Date(post.date).toLocaleDateString()}</span>
                <span>·</span>
                <span className={platformStyles.color}>{post.engagement}% engagement</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className={cn("py-4", platformStyles.lightBg)}>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlatformIcon className={cn("h-5 w-5", platformStyles.color)} />
          {data.name}
          <Badge variant="outline" className={cn("ml-auto", platformStyles.color)}>
            {data.growth >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {data.growth > 0 ? '+' : ''}{data.growth}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Overview Data */}
        {dataType === 'overview' && (
          <>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <div className="text-center flex-1 min-w-[80px]">
                <p className="text-sm text-gray-500">Followers</p>
                <p className="text-xl font-bold">{data.followers.toLocaleString()}</p>
              </div>
              <div className="text-center flex-1 min-w-[80px]">
                <p className="text-sm text-gray-500">Engagement</p>
                <p className="text-xl font-bold">{data.engagement}%</p>
              </div>
              <div className="text-center flex-1 min-w-[80px]">
                <p className="text-sm text-gray-500">Posts</p>
                <p className="text-xl font-bold">{data.posts}</p>
              </div>
            </div>
            {renderAudienceDemo()}
          </>
        )}
        
        {/* Engagement Data */}
        {dataType === 'engagement' && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded bg-gray-50">
                <ThumbsUp className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                <p className="text-lg font-bold">{data.likes.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Likes</p>
              </div>
              <div className="text-center p-2 rounded bg-gray-50">
                <Share2 className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                <p className="text-lg font-bold">{data.shares.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Shares</p>
              </div>
              <div className="text-center p-2 rounded bg-gray-50">
                <MessageCircle className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                <p className="text-lg font-bold">{data.comments.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Comments</p>
              </div>
            </div>
            {renderTopPosts()}
          </>
        )}
        
        {/* Growth Data */}
        {dataType === 'growth' && (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">Monthly Growth</p>
              <p className={cn(
                "text-sm font-semibold",
                data.growth >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.growth > 0 ? '+' : ''}{data.growth}%
              </p>
            </div>
            {renderActivityChart()}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>12 months ago</span>
              <span>Current</span>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex justify-between text-xs text-gray-500">
        <span>Last updated today</span>
        <button className={cn("font-medium", platformStyles.color)}>View details</button>
      </CardFooter>
    </Card>
  );
} 