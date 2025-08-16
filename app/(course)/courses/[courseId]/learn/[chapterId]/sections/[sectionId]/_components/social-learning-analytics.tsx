"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import {
  Users,
  MessageCircle,
  TrendingUp,
  Activity,
  Award,
  Brain,
  Clock,
  Eye,
  ThumbsUp,
  Share2,
  BookOpen,
  Target,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Reply,
  Send,
  Filter,
  Search,
  MoreHorizontal,
  Flag,
  UserPlus,
  HeartHandshake,
  Globe,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  MapPin,
  Hash,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

interface SocialLearningAnalyticsProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  currentUser: any;
  sectionTitle: string;
}

interface CollaborationAnalytics {
  totalStudents: number;
  activeNow: number;
  discussionParticipation: number;
  knowledgeSharing: number;
  peerSupport: number;
  groupFormation: number;
  socialEngagement: {
    discussions: number;
    helpRequests: number;
    resourceSharing: number;
    peerReviews: number;
  };
  trends: {
    period: string;
    discussions: number;
    collaborations: number;
    helpExchanges: number;
  }[];
  topContributors: {
    id: string;
    name: string;
    avatar: string;
    contributions: number;
    helpfulness: number;
    role: string;
  }[];
  studyGroups: {
    id: string;
    name: string;
    members: number;
    activity: string;
    focus: string;
  }[];
}

interface Discussion {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  title: string;
  content: string;
  timestamp: Date;
  votes: number;
  replies: number;
  tags: string[];
  type: 'question' | 'insight' | 'resource' | 'help';
  status: 'open' | 'resolved' | 'discussion';
  engagement: {
    views: number;
    likes: number;
    bookmarks: number;
  };
  replies_preview?: {
    author: string;
    content: string;
    helpful: boolean;
  }[];
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    joinedAt: Date;
  }[];
  activity: {
    lastActive: Date;
    messagesCount: number;
    meetingsScheduled: number;
  };
  focus: string[];
  isPublic: boolean;
  maxMembers: number;
}

export const SocialLearningAnalytics = ({
  courseId,
  chapterId,
  sectionId,
  currentUser,
  sectionTitle
}: SocialLearningAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<"analytics" | "discussions" | "groups" | "network">("analytics");
  const [collaborationData, setCollaborationData] = useState<CollaborationAnalytics | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    type: 'question' as const,
    tags: [] as string[]
  });

  const loadSocialLearningData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/sam/collaboration-analytics", {
        action: "get-social-analytics",
        data: {
          courseId,
          chapterId,
          sectionId,
          userId: currentUser.id
        }
      });

      if (response.data.success) {
        setCollaborationData(response.data.data.analytics);
        setDiscussions(response.data.data.discussions || []);
        setStudyGroups(response.data.data.studyGroups || []);
      } else {
        // Use demo data as fallback
        setCollaborationData(getDemoAnalytics());
        setDiscussions(getDemoDiscussions());
        setStudyGroups(getDemoStudyGroups());
      }
    } catch (error: any) {
      logger.error("Failed to load social learning data:", error);
      // Use demo data as fallback
      setCollaborationData(getDemoAnalytics());
      setDiscussions(getDemoDiscussions());
      setStudyGroups(getDemoStudyGroups());
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, sectionId, currentUser.id]);

  // Load social learning data
  useEffect(() => {
    loadSocialLearningData();
  }, [courseId, chapterId, sectionId, loadSocialLearningData]);

  const createDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await axios.post("/api/sam/collaboration-analytics", {
        action: "create-discussion",
        data: {
          courseId,
          chapterId,
          sectionId,
          userId: currentUser.id,
          discussion: newDiscussion
        }
      });

      if (response.data.success) {
        setDiscussions(prev => [response.data.data.discussion, ...prev]);
        setNewDiscussion({ title: '', content: '', type: 'question', tags: [] });
        setShowNewDiscussion(false);
        toast.success("Discussion created successfully!");
      } else {
        toast.error("Failed to create discussion");
      }
    } catch (error: any) {
      logger.error("Failed to create discussion:", error);
      toast.error("Failed to create discussion");
    }
  };

  const getEngagementColor = (level: number) => {
    if (level >= 80) return "text-green-600 dark:text-green-400";
    if (level >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageCircle className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'resource': return <Share2 className="w-4 h-4" />;
      case 'help': return <HeartHandshake className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question': return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case 'insight': return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 'resource': return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case 'help': return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const renderAnalyticsDashboard = () => {
    if (!collaborationData) return null;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{collaborationData.totalStudents}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{collaborationData.activeNow}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{collaborationData.socialEngagement.discussions}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{collaborationData.socialEngagement.peerReviews}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Peer Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Collaboration Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Discussion Participation</span>
                  <span className={cn("text-sm font-medium", getEngagementColor(collaborationData.discussionParticipation))}>
                    {collaborationData.discussionParticipation}%
                  </span>
                </div>
                <Progress value={collaborationData.discussionParticipation} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Knowledge Sharing</span>
                  <span className={cn("text-sm font-medium", getEngagementColor(collaborationData.knowledgeSharing))}>
                    {collaborationData.knowledgeSharing}%
                  </span>
                </div>
                <Progress value={collaborationData.knowledgeSharing} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Peer Support</span>
                  <span className={cn("text-sm font-medium", getEngagementColor(collaborationData.peerSupport))}>
                    {collaborationData.peerSupport}%
                  </span>
                </div>
                <Progress value={collaborationData.peerSupport} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Group Formation</span>
                  <span className={cn("text-sm font-medium", getEngagementColor(collaborationData.groupFormation))}>
                    {collaborationData.groupFormation}%
                  </span>
                </div>
                <Progress value={collaborationData.groupFormation} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collaborationData.topContributors.map((contributor, index) => (
                <div key={contributor.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      #{index + 1}
                    </span>
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={contributor.avatar} />
                    <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{contributor.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{contributor.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{contributor.contributions} contributions</p>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{contributor.helpfulness}% helpful</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDiscussions = () => {
    return (
      <div className="space-y-6">
        {/* Discussion Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Section Discussions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Collaborate and learn together in {sectionTitle}
            </p>
          </div>
          <Button
            onClick={() => setShowNewDiscussion(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Discussion
          </Button>
        </div>

        {/* New Discussion Form */}
        <AnimatePresence>
          {showNewDiscussion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create New Discussion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Discussion Type</Label>
                    <Select
                      value={newDiscussion.type}
                      onValueChange={(value: any) => setNewDiscussion({ ...newDiscussion, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="insight">Share Insight</SelectItem>
                        <SelectItem value="resource">Share Resource</SelectItem>
                        <SelectItem value="help">Request Help</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newDiscussion.title}
                      onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                      placeholder="What would you like to discuss?"
                    />
                  </div>

                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={newDiscussion.content}
                      onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                      placeholder="Provide details about your question, insight, or request..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createDiscussion} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-2" />
                      Post Discussion
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewDiscussion(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Discussion Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={discussion.author.avatar} />
                        <AvatarFallback>{discussion.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{discussion.author.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {discussion.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", getTypeColor(discussion.type))}>
                      {getTypeIcon(discussion.type)}
                      <span className="ml-1 capitalize">{discussion.type}</span>
                    </Badge>
                  </div>

                  {/* Discussion Content */}
                  <div>
                    <h4 className="font-medium mb-2">{discussion.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {discussion.content}
                    </p>
                  </div>

                  {/* Discussion Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" />
                        <span>{discussion.votes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Reply className="w-3 h-3" />
                        <span>{discussion.replies} replies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{discussion.engagement.views} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderStudyGroups = () => {
    return (
      <div className="space-y-6">
        {/* Study Groups Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Study Groups</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Join or create study groups for collaborative learning
            </p>
          </div>
          <Button
            onClick={() => setShowNewGroup(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Study Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studyGroups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {group.description}
                    </p>
                  </div>
                  <Badge variant={group.isPublic ? "default" : "secondary"}>
                    {group.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Group Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{group.members.length}/{group.maxMembers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{group.activity.messagesCount} messages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{group.activity.meetingsScheduled} meetings</span>
                  </div>
                </div>

                {/* Focus Areas */}
                <div className="flex flex-wrap gap-1">
                  {group.focus.map((focus, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Hash className="w-2 h-2 mr-1" />
                      {focus}
                    </Badge>
                  ))}
                </div>

                {/* Members Preview */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map((member) => (
                      <Avatar key={member.id} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {group.members.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          +{group.members.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Active {group.activity.lastActive.toLocaleDateString()}
                  </span>
                </div>

                {/* Join Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={group.members.length >= group.maxMembers}
                >
                  {group.members.length >= group.maxMembers ? "Full" : "Join Group"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSocialNetwork = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Learning Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Social network visualization coming soon!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Visualize connections, influence, and collaboration patterns
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 animate-pulse text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading social learning analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Social Learning Analytics
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect, collaborate, and learn together with your peers
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="discussions">
            <MessageCircle className="w-4 h-4 mr-2" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="w-4 h-4 mr-2" />
            Study Groups
          </TabsTrigger>
          <TabsTrigger value="network">
            <Globe className="w-4 h-4 mr-2" />
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {renderAnalyticsDashboard()}
        </TabsContent>

        <TabsContent value="discussions">
          {renderDiscussions()}
        </TabsContent>

        <TabsContent value="groups">
          {renderStudyGroups()}
        </TabsContent>

        <TabsContent value="network">
          {renderSocialNetwork()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Demo data functions
function getDemoAnalytics(): CollaborationAnalytics {
  return {
    totalStudents: 156,
    activeNow: 23,
    discussionParticipation: 78,
    knowledgeSharing: 65,
    peerSupport: 82,
    groupFormation: 45,
    socialEngagement: {
      discussions: 89,
      helpRequests: 34,
      resourceSharing: 67,
      peerReviews: 45
    },
    trends: [
      { period: "Week 1", discussions: 12, collaborations: 8, helpExchanges: 15 },
      { period: "Week 2", discussions: 18, collaborations: 12, helpExchanges: 22 },
      { period: "Week 3", discussions: 25, collaborations: 19, helpExchanges: 31 },
      { period: "Week 4", discussions: 34, collaborations: 28, helpExchanges: 45 }
    ],
    topContributors: [
      {
        id: "1",
        name: "Sarah Johnson",
        avatar: "/avatars/sarah.jpg",
        contributions: 127,
        helpfulness: 94,
        role: "Top Contributor"
      },
      {
        id: "2",
        name: "Mike Chen",
        avatar: "/avatars/mike.jpg",
        contributions: 89,
        helpfulness: 87,
        role: "Study Leader"
      },
      {
        id: "3",
        name: "Emma Davis",
        avatar: "/avatars/emma.jpg",
        contributions: 76,
        helpfulness: 91,
        role: "Peer Mentor"
      }
    ],
    studyGroups: [
      {
        id: "1",
        name: "React Masters",
        members: 8,
        activity: "Active 2h ago",
        focus: "Frontend Development"
      },
      {
        id: "2",
        name: "Algorithm Study Group",
        members: 12,
        activity: "Active 1d ago",
        focus: "Data Structures"
      }
    ]
  };
}

function getDemoDiscussions(): Discussion[] {
  const now = new Date();
  return [
    {
      id: "1",
      author: {
        id: "user1",
        name: "Alex Smith",
        avatar: "/avatars/alex.jpg",
        role: "Student"
      },
      title: "How to optimize React component re-renders?",
      content: "I'm working on a complex React application and noticing performance issues with unnecessary re-renders. What are the best practices for optimizing this?",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      votes: 15,
      replies: 8,
      tags: ["react", "performance", "optimization"],
      type: "question",
      status: "open",
      engagement: {
        views: 47,
        likes: 12,
        bookmarks: 5
      }
    },
    {
      id: "2",
      author: {
        id: "user2",
        name: "Maria Rodriguez",
        avatar: "/avatars/maria.jpg",
        role: "Mentor"
      },
      title: "Great resource for understanding hooks",
      content: "Found this excellent article that explains React hooks with practical examples. Really helped me understand useEffect dependencies better.",
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      votes: 23,
      replies: 12,
      tags: ["react", "hooks", "resources"],
      type: "resource",
      status: "discussion",
      engagement: {
        views: 89,
        likes: 31,
        bookmarks: 18
      }
    }
  ];
}

function getDemoStudyGroups(): StudyGroup[] {
  const now = new Date();
  return [
    {
      id: "1",
      name: "React Masters",
      description: "Advanced React concepts and best practices",
      members: [
        {
          id: "1",
          name: "Sarah Johnson",
          avatar: "/avatars/sarah.jpg",
          role: "Leader",
          joinedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: "2",
          name: "Mike Chen",
          avatar: "/avatars/mike.jpg",
          role: "Member",
          joinedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
        }
      ],
      activity: {
        lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        messagesCount: 156,
        meetingsScheduled: 3
      },
      focus: ["React", "Hooks", "Performance"],
      isPublic: true,
      maxMembers: 15
    },
    {
      id: "2",
      name: "Algorithm Study Circle",
      description: "Solving coding challenges and discussing algorithms",
      members: [
        {
          id: "3",
          name: "Emma Davis",
          avatar: "/avatars/emma.jpg",
          role: "Leader",
          joinedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
        }
      ],
      activity: {
        lastActive: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        messagesCount: 89,
        meetingsScheduled: 2
      },
      focus: ["Algorithms", "Data Structures", "Problem Solving"],
      isPublic: false,
      maxMembers: 10
    }
  ];
}