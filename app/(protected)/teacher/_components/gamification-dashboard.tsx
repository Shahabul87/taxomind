"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  Users, 
  TrendingUp, 
  Calendar,
  Gift,
  Medal,
  Crown,
  Zap,
  Award,
  Clock,
  BarChart3,
  Sparkles,
  Heart,
  Gamepad2,
  Rocket,
  Lock,
  CheckCircle2,
  Timer,
  ArrowUp,
  ArrowDown,
  Minus,
  PlayCircle,
  PauseCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import new UI components
import { LoadingSpinner, DashboardStatsSkeleton } from './ui/loading-states';
import { FadeIn, SlideIn, AnimatedCounter, HoverLift } from './ui/animations';
import { ErrorBoundary } from './ui/error-handling';
import { AccessibleButton } from './ui/accessibility';

interface GamificationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  learningContext: any;
  tutorMode: 'teacher' | 'student';
}

export function GamificationDashboard({ 
  isOpen, 
  onClose, 
  learningContext, 
  tutorMode 
}: GamificationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState<any>(null);

  // Fetch gamification data function - moved before useEffect
  const fetchGamificationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [achievementsRes, challengesRes, leaderboardRes] = await Promise.all([
        fetch('/api/sam/ai-tutor/achievements'),
        fetch('/api/sam/ai-tutor/challenges'),
        fetch('/api/sam/ai-tutor/leaderboard')
      ]);

      const [achievementsData, challengesData, leaderboardData] = await Promise.all([
        achievementsRes.json(),
        challengesRes.json(),
        leaderboardRes.json()
      ]);

      setAchievements(achievementsData.achievements || []);
      setChallenges(challengesData.challenges || []);
      setLeaderboard(leaderboardData.leaderboard || []);
      setUserStats(leaderboardData.userRank || {});
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast.error('Failed to load gamification data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch gamification data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGamificationData();
    }
  }, [isOpen, fetchGamificationData]);

  const handleStartChallenge = useCallback(async (challengeId: string) => {
    try {
      const response = await fetch('/api/sam/ai-tutor/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_challenge', 
          challengeId 
        })
      });

      if (response.ok) {
        toast.success('Challenge started successfully!');
        fetchGamificationData();
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast.error('Failed to start challenge');
    }
  }, [fetchGamificationData]);

  const handleGetMotivation = useCallback(async (type: string) => {
    try {
      const response = await fetch('/api/sam/ai-tutor/motivation-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivationType: type,
          learningContext,
          userState: userStats,
          personalityProfile: {
            learningStyle: 'visual',
            motivationFactors: ['achievement', 'competition'],
            communicationStyle: 'enthusiastic'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMotivationMessage(data.motivation);
      }
    } catch (error) {
      console.error('Error getting motivation:', error);
      toast.error('Failed to get motivation');
    }
  }, [learningContext, userStats]);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Level</p>
                <p className="text-2xl font-bold">{userStats.level || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">Points</p>
                <p className="text-2xl font-bold">{userStats.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Streak</p>
                <p className="text-2xl font-bold">{userStats.streak || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Medal className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Badges</p>
                <p className="text-2xl font-bold">{userStats.badges || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
          <CardDescription>Progress to next level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {userStats.level || 1}</span>
              <span>{userStats.nextRankPoints || 100} points to next level</span>
            </div>
            <Progress value={(userStats.points || 0) % 1000 / 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleGetMotivation('daily_boost')}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Daily Boost</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('challenges')}
              className="flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>View Challenges</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('achievements')}
              className="flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('leaderboard')}
              className="flex items-center space-x-2"
            >
              <Crown className="w-4 h-4" />
              <span>Leaderboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Motivation Message */}
      {motivationMessage && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-indigo-600" />
              <span>Motivation Message</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-800 mb-4">{motivationMessage.message}</p>
            <div className="flex flex-wrap gap-2">
              {motivationMessage.actions?.map((action: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {achievements.filter(a => a.isUnlocked).length} / {achievements.length}
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-1 gap-3">
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={cn(
                "transition-all duration-200",
                achievement.isUnlocked 
                  ? "border-green-200 bg-green-50" 
                  : "border-gray-200 opacity-75"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "text-2xl p-2 rounded-full",
                    achievement.isUnlocked 
                      ? "bg-green-100" 
                      : "bg-gray-100"
                  )}>
                    {achievement.isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={achievement.rarity === 'legendary' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {achievement.rarity}
                        </Badge>
                        <span className="text-sm font-medium text-indigo-600">
                          +{achievement.points}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    {!achievement.isUnlocked && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{achievement.currentValue || 0} / {achievement.targetValue}</span>
                        </div>
                        <Progress value={achievement.progress || 0} className="h-1" />
                      </div>
                    )}
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const renderChallengesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Challenges</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGamificationData}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {challenges.filter(c => c.isActive && c.userProgress).map((challenge) => (
                <Card key={challenge.id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{challenge.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{challenge.name}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{challenge.userProgress?.currentValue || 0} / {challenge.targetValue}</span>
                            </div>
                            <Progress value={challenge.userProgress?.progress || 0} className="h-2" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {challenge.difficulty}
                        </Badge>
                        <p className="text-sm font-medium text-indigo-600">
                          +{challenge.reward.points}
                        </p>
                        {challenge.timeRemaining && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Timer className="w-3 h-3 inline mr-1" />
                            {challenge.timeRemaining}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="daily" className="mt-4">
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {challenges.filter(c => c.type === 'daily').map((challenge) => (
                <Card key={challenge.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{challenge.icon}</div>
                        <div>
                          <h4 className="font-semibold">{challenge.name}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {challenge.difficulty}
                        </Badge>
                        <p className="text-sm font-medium text-indigo-600">
                          +{challenge.reward.points}
                        </p>
                        {challenge.canStart && (
                          <Button
                            size="sm"
                            onClick={() => handleStartChallenge(challenge.id)}
                            className="mt-2"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-4">
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {challenges.filter(c => c.type === 'weekly').map((challenge) => (
                <Card key={challenge.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{challenge.icon}</div>
                        <div>
                          <h4 className="font-semibold">{challenge.name}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {challenge.difficulty}
                        </Badge>
                        <p className="text-sm font-medium text-indigo-600">
                          +{challenge.reward.points}
                        </p>
                        {challenge.canStart && (
                          <Button
                            size="sm"
                            onClick={() => handleStartChallenge(challenge.id)}
                            className="mt-2"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {challenges.filter(c => c.userProgress?.completed).map((challenge) => (
                <Card key={challenge.id} className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{challenge.icon}</div>
                        <div>
                          <h4 className="font-semibold">{challenge.name}</h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
                        <p className="text-sm font-medium text-green-600">
                          +{challenge.reward.points}
                        </p>
                        {challenge.userProgress?.completedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(challenge.userProgress.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderLeaderboardTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Leaderboard</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Rank #{userStats.rank || 'N/A'}
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {leaderboard.map((user, index) => (
            <Card key={user.userId} className={cn(
              "transition-all duration-200",
              index < 3 && "border-yellow-200 bg-yellow-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                      {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                      {index === 2 && <Award className="w-5 h-5 text-orange-500" />}
                      {index > 2 && <span className="text-sm font-bold">{user.rank}</span>}
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <p className="text-sm text-gray-600">Level {user.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{user.points}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Flame className="w-3 h-3" />
                      <span>{user.streak}</span>
                      <Trophy className="w-3 h-3 ml-2" />
                      <span>{user.badges}</span>
                    </div>
                    {user.change !== undefined && (
                      <div className="flex items-center justify-end mt-1">
                        {user.change > 0 && <ArrowUp className="w-3 h-3 text-green-500" />}
                        {user.change < 0 && <ArrowDown className="w-3 h-3 text-red-500" />}
                        {user.change === 0 && <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={cn(
                          "text-xs ml-1",
                          user.change > 0 && "text-green-600",
                          user.change < 0 && "text-red-600",
                          user.change === 0 && "text-gray-500"
                        )}>
                          {Math.abs(user.change)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Gamepad2 className="w-6 h-6" />
            <span>Gamification Dashboard</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            {renderAchievementsTab()}
          </TabsContent>
          
          <TabsContent value="challenges" className="mt-6">
            {renderChallengesTab()}
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            {renderLeaderboardTab()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}