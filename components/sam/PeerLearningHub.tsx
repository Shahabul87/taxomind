'use client';

/**
 * PeerLearningHub Component
 *
 * Collaborative learning space for peer interactions and study groups.
 *
 * Features:
 * - Peer matching and recommendations
 * - Study group formation
 * - Peer review system
 * - Discussion forums
 * - Collaborative activities
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  MessageCircle,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronRight,
  Send,
  Heart,
  ThumbsUp,
  Award,
  BookOpen,
  Target,
  Zap,
  Shield,
  Crown,
  Sparkles,
  Video,
  Calendar,
  Bell,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ActivityType = 'peer-review' | 'study-group' | 'discussion' | 'collaboration' | 'tutoring';
type GroupStatus = 'forming' | 'active' | 'completed' | 'paused';

interface PeerMatch {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  matchScore: number;
  sharedTopics: string[];
  complementarySkills: string[];
  studyStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  availability: string;
  reputation: number;
  isOnline: boolean;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  topic: string;
  memberCount: number;
  maxMembers: number;
  status: GroupStatus;
  nextSession?: string;
  leaderId: string;
  members: GroupMember[];
  activityScore: number;
  tags: string[];
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'leader' | 'moderator' | 'member';
  contribution: number;
  isOnline: boolean;
}

interface PeerActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  participants: number;
  maxParticipants?: number;
  scheduledAt?: string;
  duration?: number;
  xpReward: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  hostId?: string;
  hostName?: string;
}

interface PeerReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  feedback: string;
  helpful: number;
  createdAt: string;
  verified: boolean;
}

interface PeerLearningStats {
  totalPeers: number;
  groupsJoined: number;
  reviewsGiven: number;
  reviewsReceived: number;
  collaborationHours: number;
  helpfulnessScore: number;
  reputation: number;
}

interface PeerLearningHubProps {
  className?: string;
  compact?: boolean;
  courseId?: string;
  onPeerConnect?: (peerId: string) => void;
  onGroupJoin?: (groupId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIVITY_TYPE_CONFIG = {
  'peer-review': { icon: CheckCircle2, color: 'text-green-500 bg-green-500/10', label: 'Peer Review' },
  'study-group': { icon: Users, color: 'text-blue-500 bg-blue-500/10', label: 'Study Group' },
  'discussion': { icon: MessageCircle, color: 'text-purple-500 bg-purple-500/10', label: 'Discussion' },
  'collaboration': { icon: Zap, color: 'text-orange-500 bg-orange-500/10', label: 'Collaboration' },
  'tutoring': { icon: BookOpen, color: 'text-cyan-500 bg-cyan-500/10', label: 'Tutoring' },
};

const GROUP_STATUS_CONFIG = {
  forming: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', label: 'Forming' },
  active: { color: 'bg-green-500/10 text-green-600 border-green-500/30', label: 'Active' },
  completed: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', label: 'Completed' },
  paused: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', label: 'Paused' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatsOverview({ stats }: { stats: PeerLearningStats }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
        <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
        <span className="text-lg font-bold block">{stats.totalPeers}</span>
        <span className="text-xs text-muted-foreground">Peers</span>
      </div>
      <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5">
        <Target className="w-5 h-5 mx-auto mb-1 text-purple-500" />
        <span className="text-lg font-bold block">{stats.groupsJoined}</span>
        <span className="text-xs text-muted-foreground">Groups</span>
      </div>
      <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5">
        <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
        <span className="text-lg font-bold block">{stats.reviewsGiven}</span>
        <span className="text-xs text-muted-foreground">Reviews</span>
      </div>
      <div className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
        <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
        <span className="text-lg font-bold block">{stats.reputation}</span>
        <span className="text-xs text-muted-foreground">Rep</span>
      </div>
    </div>
  );
}

function PeerMatchCard({
  peer,
  onConnect,
}: {
  peer: PeerMatch;
  onConnect?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:shadow-md transition-all">
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={peer.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {peer.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        {peer.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{peer.name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs">
                  {peer.matchScore}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Match score based on shared interests and complementary skills</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            {peer.reputation}
          </span>
          <span>•</span>
          <span className="truncate">{peer.sharedTopics.slice(0, 2).join(', ')}</span>
        </div>
      </div>

      <Button size="sm" onClick={onConnect}>
        <UserPlus className="w-4 h-4 mr-1" />
        Connect
      </Button>
    </div>
  );
}

function StudyGroupCard({
  group,
  onJoin,
}: {
  group: StudyGroup;
  onJoin?: () => void;
}) {
  const statusConfig = GROUP_STATUS_CONFIG[group.status];
  const isFull = group.memberCount >= group.maxMembers;

  return (
    <div className="p-4 rounded-xl bg-card border hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{group.name}</h4>
            <Badge className={cn('text-xs', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex -space-x-2">
          {group.members.slice(0, 4).map((member) => (
            <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {member.name[0]}
              </AvatarFallback>
            </Avatar>
          ))}
          {group.memberCount > 4 && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
              +{group.memberCount - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-1">
          {group.memberCount}/{group.maxMembers} members
        </span>
      </div>

      {/* Next session & tags */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {group.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-muted">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {group.nextSession && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(group.nextSession).toLocaleDateString()}
            </span>
          )}
          <Button
            size="sm"
            variant={isFull ? 'secondary' : 'default'}
            disabled={isFull}
            onClick={onJoin}
          >
            {isFull ? 'Full' : 'Join'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: PeerActivity }) {
  const config = ACTIVITY_TYPE_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn('p-2 rounded-lg', config.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{activity.title}</span>
          <Badge variant="outline" className="text-xs">
            +{activity.xpReward} XP
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {activity.participants}
            {activity.maxParticipants && `/${activity.maxParticipants}`}
          </span>
          {activity.scheduledAt && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(activity.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ReviewCard({ review }: { review: PeerReview }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={review.reviewerAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {review.reviewerName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{review.reviewerName}</span>
            {review.verified && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            <div className="flex items-center gap-0.5 ml-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-3 h-3',
                    star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{review.feedback}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <ThumbsUp className="w-3 h-3" />
              {review.helpful} helpful
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PeerLearningHub({
  className,
  compact = false,
  courseId,
  onPeerConnect,
  onGroupJoin,
}: PeerLearningHubProps) {
  const [stats, setStats] = useState<PeerLearningStats | null>(null);
  const [peerMatches, setPeerMatches] = useState<PeerMatch[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [activities, setActivities] = useState<PeerActivity[]>([]);
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);

      const [statsRes, matchesRes, groupsRes, activitiesRes] = await Promise.all([
        fetch(`/api/sam/peer-learning?action=get-stats&${params}`),
        fetch(`/api/sam/peer-learning?action=get-matches&${params}&limit=5`),
        fetch(`/api/sam/peer-learning?action=get-groups&${params}&limit=3`),
        fetch(`/api/sam/peer-learning?action=get-activities&${params}&limit=5`),
      ]);

      const [statsData, matchesData, groupsData, activitiesData] = await Promise.all([
        statsRes.json(),
        matchesRes.json(),
        groupsRes.json(),
        activitiesRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data.stats);
      if (matchesData.success) setPeerMatches(matchesData.data.matches || []);
      if (groupsData.success) setStudyGroups(groupsData.data.groups || []);
      if (activitiesData.success) setActivities(activitiesData.data.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Finding your peers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Peer Learning Hub</CardTitle>
              <CardDescription>Connect, collaborate, and grow together</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Overview */}
        {stats && <StatsOverview stats={stats} />}

        {/* Peer Matches */}
        {peerMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Recommended Peers
              </h4>
              <Button variant="ghost" size="sm">
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {peerMatches.slice(0, compact ? 2 : 3).map((peer) => (
                <PeerMatchCard
                  key={peer.id}
                  peer={peer}
                  onConnect={() => onPeerConnect?.(peer.userId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Study Groups */}
        {studyGroups.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Study Groups
              </h4>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create Group
              </Button>
            </div>
            <div className="space-y-2">
              {studyGroups.slice(0, compact ? 1 : 2).map((group) => (
                <StudyGroupCard
                  key={group.id}
                  group={group}
                  onJoin={() => onGroupJoin?.(group.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activities */}
        {!compact && activities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Upcoming Activities
            </h4>
            <div className="space-y-2">
              {activities.slice(0, 3).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {peerMatches.length === 0 && studyGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-500/10 to-teal-500/10 mb-4">
              <Users className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Find Your Learning Community</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
              Connect with peers who share your interests and learning goals.
            </p>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Find Peers
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PeerLearningHub;
