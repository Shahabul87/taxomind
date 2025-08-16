"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import { 
  Users, 
  MessageCircle, 
  Eye, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Target,
  BookOpen,
  Video,
  Music,
  FileText,
  Star,
  Play,
  Clock,
  Activity,
  Zap,
  BarChart3,
  PieChart,
  TrendingDown
} from "lucide-react";
import { getDashboardData } from "@/app/actions/social-media-actions";
import { ConnectPlatformModal } from "./ConnectPlatformModal";

interface DashboardStats {
  socialAccounts: any[];
  contentStats: any[];
  subscriptionStats: any;
  goalStats: any[];
  recentActivity: any[];
}

interface ProfileOverviewProps {
  userId: string;
}

export function ProfileOverview({ userId }: ProfileOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardData();
        setStats(data);
      } catch (error: any) {
        logger.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const socialAccountsCount = stats?.socialAccounts?.length || 0;
  const totalFollowers = stats?.socialAccounts?.reduce((sum, account) => sum + (account.followerCount || 0), 0) || 0;
  const totalContent = stats?.contentStats?.reduce((sum, stat) => sum + stat._count, 0) || 0;
  const monthlySpending = stats?.subscriptionStats?._sum?.cost || 0;
  const activeGoals = stats?.goalStats?.filter(goal => goal.status === 'ACTIVE')?.length || 0;
  const completedGoals = stats?.goalStats?.filter(goal => goal.status === 'COMPLETED')?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Message for New Users */}
      {(!stats || (
        (stats.socialAccounts?.length || 0) === 0 && 
        (stats.contentStats?.length || 0) === 0 && 
        (stats.goalStats?.length || 0) === 0 &&
        (stats.recentActivity?.length || 0) === 0
      )) && (
        <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Your Dashboard! 🎉</h2>
              <p className="text-indigo-200 mb-4">
                Start by connecting your social media accounts and adding content to track your digital presence
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <ConnectPlatformModal 
                  userId={userId}
                  onProfileLinksUpdated={(links) => {

                    // Optionally refresh the data
                  }}
                >
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-700 text-white hover:from-blue-700 hover:to-purple-800">
                    Connect Social Media
                  </Button>
                </ConnectPlatformModal>
                <Button 
                  variant="outline" 
                  className="border-indigo-600 text-indigo-300 hover:bg-indigo-700"
                  onClick={() => {
                    const contentTab = document.querySelector('[data-value="content"]') as HTMLElement;
                    contentTab?.click();
                  }}
                >
                  Add Content
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Social Media Stats */}
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Connected Platforms</p>
                <p className="text-2xl font-bold text-white">{socialAccountsCount}</p>
                <p className="text-blue-300 text-xs">
                  {totalFollowers.toLocaleString()} total followers
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Stats */}
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Content Items</p>
                <p className="text-2xl font-bold text-white">{totalContent}</p>
                <p className="text-purple-300 text-xs">
                  Across all collections
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Spending */}
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Monthly Spending</p>
                <p className="text-2xl font-bold text-white">${monthlySpending.toFixed(2)}</p>
                <p className="text-green-300 text-xs">
                  {stats?.subscriptionStats?._count || 0} active subscriptions
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm font-medium">Active Goals</p>
                <p className="text-2xl font-bold text-white">{activeGoals}</p>
                <p className="text-orange-300 text-xs">
                  {completedGoals} completed this year
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Media Overview */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Social Media Activity
            </CardTitle>
            <CardDescription className="text-slate-400">
              Overview of your connected social platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.socialAccounts?.length ? (
              stats.socialAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {account.platform.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-medium">@{account.username}</p>
                      <p className="text-slate-400 text-sm">{account.platform}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{(account.followerCount || 0).toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">followers</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No social media accounts connected</p>
                <p className="text-slate-500 text-sm mb-4">Connect your social media accounts to track your online presence and engagement</p>
                <ConnectPlatformModal 
                  userId={userId}
                  onProfileLinksUpdated={(links) => {

                    // Optionally refresh the data
                  }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Connect Platform
                  </Button>
                </ConnectPlatformModal>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Content Library
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your curated content by type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.contentStats?.length ? (
              stats.contentStats.map((stat) => {
                const icons = {
                  VIDEO: Video,
                  AUDIO: Music,
                  ARTICLE: FileText,
                  BLOG: FileText,
                  COURSE: BookOpen,
                  PODCAST: Music
                };
                const Icon = icons[stat.contentType as keyof typeof icons] || FileText;
                
                return (
                  <div key={stat.contentType} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">{stat.contentType.toLowerCase()}</p>
                        <p className="text-slate-400 text-sm">{stat._count} items</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                      {stat._count}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No content saved yet</p>
                <p className="text-slate-500 text-sm mb-4">Start curating your favorite videos, articles, and other content</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => {
                    // Navigate to content tab
                    const contentTab = document.querySelector('[data-value="content"]') as HTMLElement;
                    contentTab?.click();
                  }}
                >
                  Add Content
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals and Progress */}
      {(stats?.goalStats?.length ?? 0) > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Active Goals
            </CardTitle>
            <CardDescription className="text-slate-400">
              Track your progress towards your objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.goalStats
                .filter(goal => goal.status === 'ACTIVE')
                .slice(0, 4)
                .map((goal) => {
                  const progress = goal.targetValue 
                    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
                    : 0;
                  
                  return (
                    <div key={goal.id} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">{goal.title}</h4>
                        <Badge 
                          variant="outline" 
                          className="border-orange-600/50 text-orange-300 bg-orange-600/10"
                        >
                          {goal.category}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2 bg-slate-700"
                        />
                        {goal.targetValue && (
                          <p className="text-slate-400 text-sm">
                            {goal.currentValue} / {goal.targetValue} {goal.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your latest platform interactions and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity?.length ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/30">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      {activity.analyticsType.replace('_', ' ').toLowerCase()} activity
                    </p>
                    <p className="text-slate-400 text-xs">
                      {new Date(activity.recordedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-indigo-400 font-medium">
                    {activity.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No recent activity</p>
              <p className="text-slate-500 text-sm mb-4">Your activity will appear here as you use the platform</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => {
                  // Navigate to activity tab
                  const activityTab = document.querySelector('[data-value="activity"]') as HTMLElement;
                  activityTab?.click();
                }}
              >
                View Activity Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 