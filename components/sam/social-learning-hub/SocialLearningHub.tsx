"use client";

/**
 * SocialLearningHub
 *
 * A unified social learning hub that combines community feed, collaboration space,
 * peer learning, and study buddy features into a cohesive social learning experience.
 *
 * Phase 3 of the engine merge plan - integrating SocialEngine,
 * CollaborationEngine, and PeerLearningEngine.
 *
 * @module components/sam/social-learning-hub
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Users,
  MessageSquare,
  Share2,
  UserPlus,
  Activity,
  ChevronRight,
  Sparkles,
  Heart,
  Award,
  BookOpen,
  Video,
  Layers,
  Star,
  Trophy,
  Target,
  Zap,
  Bell,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import existing social components
import { SocialLearningFeed } from "@/components/sam/SocialLearningFeed";
import { CollaborationSpace } from "@/components/sam/CollaborationSpace";
import { PeerLearningHub } from "@/components/sam/PeerLearningHub";
import { StudyBuddyFinder } from "@/components/sam/StudyBuddyFinder";

export interface SocialLearningHubProps {
  userId?: string;
  courseId?: string;
  compact?: boolean;
  className?: string;
  defaultTab?: "overview" | "feed" | "collaborate" | "peers";
  onPostClick?: (post: { id: string; type: string }) => void;
  onChallengeJoin?: (challengeId: string) => void;
  onJoinSession?: (sessionId: string) => void;
  onCreateResource?: (type: string) => void;
}

interface SocialMetric {
  id: string;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  status?: "active" | "growing" | "featured";
  icon: typeof Users;
}

interface AccessibleCourse {
  id: string;
  title: string;
  sources?: string[];
}

interface SocialGroupSummary {
  id: string;
  name: string;
  description?: string | null;
  memberCount?: number;
}

const SOCIAL_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    description: "Quick social learning summary",
  },
  {
    id: "feed",
    label: "Community",
    icon: MessageSquare,
    description: "Learning achievements and discussions",
  },
  {
    id: "collaborate",
    label: "Collaborate",
    icon: Layers,
    description: "Real-time collaboration workspace",
  },
  {
    id: "peers",
    label: "Peers",
    icon: Users,
    description: "Find study partners and groups",
  },
] as const;

type TabId = typeof SOCIAL_TABS[number]["id"];

export function SocialLearningHub({
  userId,
  courseId,
  compact = false,
  className,
  defaultTab = "overview",
  onPostClick,
  onChallengeJoin,
  onJoinSession,
  onCreateResource,
}: SocialLearningHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [peerHubDialogOpen, setPeerHubDialogOpen] = useState(false);
  const [courses, setCourses] = useState<AccessibleCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId ?? "");
  const [groups, setGroups] = useState<SocialGroupSummary[]>([]);
  const [socialAnalytics, setSocialAnalytics] = useState<any | null>(null);
  const [collaborationInsights, setCollaborationInsights] = useState<any | null>(null);
  const [effectiveness, setEffectiveness] = useState<any | null>(null);
  const [engagement, setEngagement] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  useEffect(() => {
    if (courseId) {
      setSelectedCourseId(courseId);
    }
  }, [courseId]);

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [coursesRes, groupsRes] = await Promise.all([
        fetch("/api/sam/courses/accessible"),
        fetch("/api/sam/social-engine/groups"),
      ]);

      if (!coursesRes.ok) {
        throw new Error("Failed to load courses");
      }

      if (!groupsRes.ok) {
        throw new Error("Failed to load groups");
      }

      const coursesPayload = await coursesRes.json();
      const groupsPayload = await groupsRes.json();

      const courseList = (coursesPayload.data ?? []) as AccessibleCourse[];
      const groupList = (groupsPayload.data ?? []) as SocialGroupSummary[];

      setCourses(courseList);
      setGroups(groupList);
      setSelectedCourseId((prev) => prev || courseId || courseList[0]?.id || "");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load social context");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const loadCourseAnalytics = useCallback(async () => {
    if (!selectedCourseId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const [socialRes, collaborationRes] = await Promise.all([
        fetch("/api/sam/collaboration-analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-social-analytics",
            data: { courseId: selectedCourseId },
          }),
        }),
        fetch("/api/sam/collaboration-analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "get-collaboration-insights",
            data: { courseId: selectedCourseId },
          }),
        }),
      ]);

      if (!socialRes.ok || !collaborationRes.ok) {
        throw new Error("Failed to load collaboration analytics");
      }

      const socialPayload = await socialRes.json();
      const collaborationPayload = await collaborationRes.json();

      setSocialAnalytics(socialPayload.data ?? null);
      setCollaborationInsights(collaborationPayload.data ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  const loadGroupAnalytics = useCallback(async () => {
    if (groups.length === 0) {
      setEffectiveness(null);
      setEngagement(null);
      return;
    }

    const groupId = groups[0].id;

    try {
      const [effectivenessRes, engagementRes] = await Promise.all([
        fetch("/api/sam/social-engine/effectiveness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId }),
        }),
        fetch("/api/sam/social-engine/engagement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ communityId: groupId }),
        }),
      ]);

      if (effectivenessRes.ok) {
        const effectivenessPayload = await effectivenessRes.json();
        setEffectiveness(effectivenessPayload.data ?? null);
      }

      if (engagementRes.ok) {
        const engagementPayload = await engagementRes.json();
        setEngagement(engagementPayload.data ?? null);
      }
    } catch {
      // Keep group analytics optional
    }
  }, [groups]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    loadCourseAnalytics();
  }, [loadCourseAnalytics]);

  useEffect(() => {
    loadGroupAnalytics();
  }, [loadGroupAnalytics]);

  const quickMetrics = useMemo<SocialMetric[]>(() => {
    const discussionParticipation = socialAnalytics?.analytics?.discussionParticipation;
    const totalSessions = collaborationInsights?.courseInsights?.totalSessions;
    const overallEffectiveness = effectiveness?.effectiveness?.overall;

    return [
      {
        id: "connections",
        label: "Study Groups",
        value: groups.length || "—",
        status: groups.length > 0 ? "active" : undefined,
        icon: Users,
      },
      {
        id: "discussions",
        label: "Discussion Rate",
        value: discussionParticipation ? `${discussionParticipation}%` : "—",
        trend: discussionParticipation ? "up" : undefined,
        icon: MessageSquare,
      },
      {
        id: "collaborations",
        label: "Sessions (30d)",
        value: totalSessions ?? "—",
        status: totalSessions ? "active" : undefined,
        icon: Layers,
      },
      {
        id: "achievements",
        label: "Collab Health",
        value: overallEffectiveness !== undefined ? `${Math.round(overallEffectiveness * 100)}%` : "—",
        status: overallEffectiveness ? "featured" : undefined,
        icon: Trophy,
      },
    ];
  }, [collaborationInsights, effectiveness, groups.length, socialAnalytics]);

  const formatPercent = (value?: number) =>
    value !== undefined ? `${Math.round(value * 100)}%` : "—";

  // Compact mode - just quick action buttons
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("feed")}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Community
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Join discussions and share achievements
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("collaborate")}
                className="gap-2"
              >
                <Layers className="h-4 w-4 text-purple-500" />
                Collaborate
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Real-time collaboration workspace
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeerHubDialogOpen(true)}
                className="gap-2"
              >
                <Users className="h-4 w-4 text-green-500" />
                Find Peers
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Find study buddies and join groups
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Peer Learning Hub Dialog */}
        <Dialog open={peerHubDialogOpen} onOpenChange={setPeerHubDialogOpen}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
            <PeerLearningHub />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full mode - card with tabs
  return (
    <Card className={cn("overflow-hidden border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Social Learning Hub
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Connect, collaborate, and learn together with your peers
            </CardDescription>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Community
            </Badge>
            {courses.length > 0 && (
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="h-8 w-[200px]">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={loadCourseAnalytics}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 dark:bg-slate-800/50 p-1 h-auto flex-wrap">
            {SOCIAL_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg px-3 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4">
            {loadError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {loadError}
              </div>
            )}

            {!selectedCourseId && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                Select a course to load social learning insights.
              </div>
            )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn(
                        "h-4 w-4",
                        metric.status === "active" ? "text-green-500" :
                        metric.status === "growing" ? "text-blue-500" :
                        metric.status === "featured" ? "text-yellow-500" : "text-slate-500"
                      )} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metric.value}
                      {metric.trend && (
                        <Zap className={cn(
                          "inline h-3 w-3 ml-1",
                          metric.trend === "up" ? "text-green-500" : "text-slate-400"
                        )} />
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {(effectiveness || engagement || collaborationInsights) && (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-slate-500">Effectiveness</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatPercent(effectiveness?.effectiveness?.overall)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Knowledge sharing: {formatPercent(effectiveness?.effectiveness?.knowledgeSharing)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-slate-500">Engagement</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatPercent(engagement?.engagement?.participationRate)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Growth rate: {formatPercent(engagement?.engagement?.networkGrowth)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-slate-500">Collaboration Health</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatPercent(collaborationInsights?.courseInsights?.collaborationHealth)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Sessions: {collaborationInsights?.courseInsights?.totalSessions ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Access Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Community Feed Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("feed")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Community Feed
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Achievements, discussions, challenges
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <span className="text-slate-600 dark:text-slate-300">Share Wins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-slate-500">Challenges</span>
                  </div>
                </div>
              </motion.div>

              {/* Collaboration Space Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("collaborate")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Collaboration Space
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time workspace and tasks
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  {["Documents", "Whiteboard", "Tasks"].map((feature) => (
                    <Badge
                      key={feature}
                      variant="outline"
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Peer Learning Quick Access */}
            <motion.div
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer"
              onClick={() => setActiveTab("peers")}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Peer Learning &amp; Study Groups
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Find study buddies, join groups, and learn together
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Find Buddies
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </motion.div>

            {/* Study Buddy Quick Finder (inline mini version) */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Connect
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <Video className="h-4 w-4" />
                  Start Video Session
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Join Discussion
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Study Group
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Community Feed Tab */}
          <TabsContent value="feed" className="p-4">
            <SocialLearningFeed
              compact={false}
              onPostClick={onPostClick}
              onChallengeJoin={onChallengeJoin}
            />
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaborate" className="p-4">
            <CollaborationSpace
              compact={false}
              onJoinSession={onJoinSession}
              onCreateResource={onCreateResource}
            />
          </TabsContent>

          {/* Peers Tab */}
          <TabsContent value="peers" className="p-0">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Study Buddy Finder */}
              <div className="p-4 border-r border-slate-200 dark:border-slate-700">
                <StudyBuddyFinder />
              </div>
              {/* Peer Learning Hub */}
              <div className="p-4">
                <PeerLearningHub />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Peer Learning Dialog for expanded view */}
      <Dialog open={peerHubDialogOpen} onOpenChange={setPeerHubDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <PeerLearningHub />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default SocialLearningHub;
