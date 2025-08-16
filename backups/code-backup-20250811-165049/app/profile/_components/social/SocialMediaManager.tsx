"use client";

import { useState, useEffect } from "react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  TrendingUp,
  TrendingDown,
  Link as LinkIcon,
  Unlink,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Github,
  RefreshCw,
  BarChart3,
  Calendar,
  Globe
} from "lucide-react";
import { connectSocialMediaAccount, updateSocialMediaStats, disconnectSocialMediaAccount } from "@/app/actions/social-media-actions";
import { SocialPlatform } from "@prisma/client";
import { toast } from "sonner";

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName?: string;
  profileUrl?: string;
  profileImageUrl?: string;
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
  lastSyncAt?: Date;
  socialPosts?: any[];
  socialMetrics?: any[];
}

interface SocialMediaManagerProps {
  userId: string;
  initialAccounts?: SocialAccount[];
}

const platformIcons = {
  INSTAGRAM: Instagram,
  TWITTER: Twitter,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  GITHUB: Github,
  TIKTOK: Globe,
  TWITCH: Globe,
  DISCORD: Globe,
  REDDIT: Globe,
  MEDIUM: Globe,
  DRIBBBLE: Globe,
  BEHANCE: Globe
};

const platformColors = {
  INSTAGRAM: "from-pink-500 to-purple-500",
  TWITTER: "from-blue-400 to-blue-600",
  YOUTUBE: "from-red-500 to-red-600",
  FACEBOOK: "from-blue-600 to-blue-800",
  LINKEDIN: "from-blue-700 to-blue-900",
  GITHUB: "from-gray-700 to-gray-900",
  TIKTOK: "from-black to-gray-800",
  TWITCH: "from-purple-500 to-purple-700",
  DISCORD: "from-indigo-500 to-indigo-700",
  REDDIT: "from-orange-500 to-orange-600",
  MEDIUM: "from-green-500 to-green-600",
  DRIBBBLE: "from-pink-400 to-pink-600",
  BEHANCE: "from-blue-500 to-purple-500"
};

export function SocialMediaManager({ userId, initialAccounts = [] }: SocialMediaManagerProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    platform: "" as SocialPlatform,
    username: "",
    displayName: "",
    profileUrl: "",
    followerCount: 0,
    followingCount: 0,
    postsCount: 0
  });
  const [loading, setLoading] = useState(false);

  const handleAddAccount = async () => {
    if (!newAccount.platform || !newAccount.username) {
      toast.error("Platform and username are required");
      return;
    }

    setLoading(true);
    try {
      const result = await connectSocialMediaAccount({
        platform: newAccount.platform,
        username: newAccount.username,
        displayName: newAccount.displayName || undefined,
        profileUrl: newAccount.profileUrl || undefined,
        followerCount: newAccount.followerCount || 0,
        followingCount: newAccount.followingCount || 0,
        postsCount: newAccount.postsCount || 0
      });

      if (result.success) {
        setAccounts([...accounts, result.data]);
        setNewAccount({
          platform: "" as SocialPlatform,
          username: "",
          displayName: "",
          profileUrl: "",
          followerCount: 0,
          followingCount: 0,
          postsCount: 0
        });
        setIsAddingAccount(false);
        toast.success("Social media account connected successfully!");
      } else {
        toast.error(result.error || "Failed to connect account");
      }
    } catch (error) {
      toast.error("An error occurred while connecting the account");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStats = async (accountId: string, stats: any) => {
    try {
      const result = await updateSocialMediaStats(accountId, stats);
      if (result.success) {
        setAccounts(accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, ...stats, lastSyncAt: new Date() }
            : acc
        ));
        toast.success("Stats updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update stats");
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const result = await disconnectSocialMediaAccount(accountId);
      if (result.success) {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        toast.success("Account disconnected successfully!");
      }
    } catch (error) {
      toast.error("Failed to disconnect account");
    }
  };

  const getTotalFollowers = () => {
    return accounts.reduce((sum, account) => sum + (account.followerCount || 0), 0);
  };

  const getTotalPosts = () => {
    return accounts.reduce((sum, account) => sum + (account.postsCount || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Followers</p>
                <p className="text-2xl font-bold text-white">{getTotalFollowers().toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Connected Platforms</p>
                <p className="text-2xl font-bold text-white">{accounts.length}</p>
              </div>
              <LinkIcon className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Total Posts</p>
                <p className="text-2xl font-bold text-white">{getTotalPosts().toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Connected Accounts</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your social media integrations
              </CardDescription>
            </div>
            <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Connect Social Media Account</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Add a new social media platform to your profile
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platform" className="text-white">Platform</Label>
                    <Select
                      value={newAccount.platform}
                      onValueChange={(value) => setNewAccount({ ...newAccount, platform: value as SocialPlatform })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {Object.keys(platformIcons).map((platform) => (
                          <SelectItem key={platform} value={platform} className="text-white hover:bg-slate-600">
                            <div className="flex items-center gap-2">
                              {React.createElement(platformIcons[platform as keyof typeof platformIcons], { className: "w-4 h-4" })}
                              {platform}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      value={newAccount.username}
                      onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                      placeholder="@username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="displayName" className="text-white">Display Name (Optional)</Label>
                    <Input
                      id="displayName"
                      value={newAccount.displayName}
                      onChange={(e) => setNewAccount({ ...newAccount, displayName: e.target.value })}
                      placeholder="Your Name"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profileUrl" className="text-white">Profile URL (Optional)</Label>
                    <Input
                      id="profileUrl"
                      value={newAccount.profileUrl}
                      onChange={(e) => setNewAccount({ ...newAccount, profileUrl: e.target.value })}
                      placeholder="https://..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="followers" className="text-white">Followers</Label>
                      <Input
                        id="followers"
                        type="number"
                        value={newAccount.followerCount}
                        onChange={(e) => setNewAccount({ ...newAccount, followerCount: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="following" className="text-white">Following</Label>
                      <Input
                        id="following"
                        type="number"
                        value={newAccount.followingCount}
                        onChange={(e) => setNewAccount({ ...newAccount, followingCount: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="posts" className="text-white">Posts</Label>
                      <Input
                        id="posts"
                        type="number"
                        value={newAccount.postsCount}
                        onChange={(e) => setNewAccount({ ...newAccount, postsCount: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddAccount}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      Connect Account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingAccount(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => {
                const Icon = platformIcons[account.platform];
                const colorClass = platformColors[account.platform];
                
                return (
                  <Card key={account.id} className="bg-slate-900/50 border-slate-700/50 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectAccount(account.id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h3 className="text-white font-semibold">@{account.username}</h3>
                          {account.displayName && (
                            <p className="text-slate-400 text-sm">{account.displayName}</p>
                          )}
                        </div>

                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {account.platform}
                        </Badge>

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700">
                          <div className="text-center">
                            <p className="text-white font-medium">{(account.followerCount || 0).toLocaleString()}</p>
                            <p className="text-slate-400 text-xs">Followers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-medium">{(account.followingCount || 0).toLocaleString()}</p>
                            <p className="text-slate-400 text-xs">Following</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-medium">{(account.postsCount || 0).toLocaleString()}</p>
                            <p className="text-slate-400 text-xs">Posts</p>
                          </div>
                        </div>

                        {account.lastSyncAt && (
                          <p className="text-slate-500 text-xs mt-2">
                            Last synced: {new Date(account.lastSyncAt).toLocaleDateString()}
                          </p>
                        )}

                        <div className="flex gap-2 mt-4">
                          {account.profileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">
                                <Globe className="w-4 h-4 mr-1" />
                                Visit
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Simulate refreshing stats
                              const randomIncrease = Math.floor(Math.random() * 10) + 1;
                              handleUpdateStats(account.id, {
                                followerCount: (account.followerCount || 0) + randomIncrease
                              });
                            }}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <LinkIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No Social Media Accounts Connected</h3>
              <p className="text-slate-400 mb-6">
                Connect your social media accounts to track analytics and manage your online presence in one place.
              </p>
              <Button
                onClick={() => setIsAddingAccount(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect Your First Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 