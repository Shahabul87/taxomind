"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSamAITutor } from '@/app/(protected)/teacher/_components/sam-ai-tutor-provider';
import { logger } from '@/lib/logger';
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Award, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  Gift,
  Crown,
  Medal,
  Sparkles,
  ChevronRight,
  BarChart3,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Achievement, type Challenge } from '@/lib/sam-achievements';

interface GamificationStats {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  totalAchievements: number;
  completedChallenges: number;
  activeChallenges: number;
  recommendations: Achievement[];
  currentStreak: number;
  longestStreak: number;
}

interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  unlockedAt: Date;
  points: number;
}

interface UserChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  progress: number;
  target: number;
  timeLeft: number; // in hours
  points: number;
  status: 'active' | 'available' | 'completed';
}

export function SAMGamificationDashboard() {
  const { data: session } = useSession();
  const { gamificationState, trackInteraction } = useSamAITutor();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Load gamification data
  useEffect(() => {
    const loadGamificationData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // Load stats
        const statsResponse = await fetch('/api/sam/gamification/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }

        // Load achievements
        const achievementsResponse = await fetch('/api/sam/gamification/achievements');
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          setAchievements(achievementsData.data);
        }

        // Load challenges
        const challengesResponse = await fetch('/api/sam/gamification/challenges');
        if (challengesResponse.ok) {
          const challengesData = await challengesResponse.json();
          setChallenges(challengesData.data);
        }
      } catch (error) {
        logger.error('Error loading gamification data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGamificationData();
  }, [session?.user?.id]);

  // Start a challenge
  const startChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/sam/gamification/challenges/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });

      if (response.ok) {
        // Refresh challenges
        const challengesResponse = await fetch('/api/sam/gamification/challenges');
        if (challengesResponse.ok) {
          const challengesData = await challengesResponse.json();
          setChallenges(challengesData.data);
        }

        trackInteraction('challenge_started', { challengeId });
      }
    } catch (error) {
      logger.error('Error starting challenge:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading gamification data...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No gamification data available</p>
      </div>
    );
  }

  const levelProgress = ((stats.totalPoints - getPointsForLevel(stats.level - 1)) / 
    (getPointsForLevel(stats.level) - getPointsForLevel(stats.level - 1))) * 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Level</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.level}</p>
              </div>
              <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2">
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {stats.pointsToNextLevel} points to next level
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Points</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.totalPoints.toLocaleString()}
                </p>
              </div>
              <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Achievements</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalAchievements}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Current Streak</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.currentStreak}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Longest: {stats.longestStreak} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recommendations */}
          {stats.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Recommended Achievements
                </CardTitle>
                <CardDescription>
                  Achievements you&apos;re close to unlocking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recommendations.map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{achievement.points} pts</Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Active Challenges ({stats.activeChallenges})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {challenges.filter(c => c.status === 'active').length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No active challenges. Start one to boost your progress!
                </p>
              ) : (
                challenges
                  .filter(c => c.status === 'active')
                  .map((challenge) => (
                    <div key={challenge.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{challenge.icon}</span>
                          <h4 className="font-medium">{challenge.name}</h4>
                          <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {challenge.timeLeft}h left
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{challenge.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{challenge.progress}/{challenge.target}</span>
                        </div>
                        <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <Badge variant={getLevelVariant(achievement.level)}>{achievement.level}</Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{achievement.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Star className="h-4 w-4" />
                      {achievement.points} points
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {achievement.unlockedAt.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                  Available Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges
                  .filter(c => c.status === 'available')
                  .map((challenge) => (
                    <div key={challenge.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{challenge.icon}</span>
                          <h4 className="font-medium">{challenge.name}</h4>
                          <Badge variant={getDifficultyVariant(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                          <Gift className="h-4 w-4" />
                          {challenge.points} pts
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{challenge.description}</p>
                      <Button 
                        onClick={() => startChallenge(challenge.id)}
                        className="w-full"
                        size="sm"
                      >
                        Start Challenge
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Completed Challenges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges
                  .filter(c => c.status === 'completed')
                  .map((challenge) => (
                    <div key={challenge.id} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{challenge.icon}</span>
                          <h4 className="font-medium">{challenge.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Level Progress</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Level {stats.level}
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalPoints}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.totalAchievements}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Achievements</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.slice(0, 5).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg">{achievement.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{achievement.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          +{achievement.points} points
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {achievement.unlockedAt.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getPointsForLevel(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000];
  return thresholds[level] || thresholds[thresholds.length - 1];
}

function getDifficultyVariant(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'secondary';
    case 'medium': return 'default';
    case 'hard': return 'destructive';
    case 'expert': return 'secondary';
    default: return 'default';
  }
}

function getLevelVariant(level: string) {
  switch (level.toLowerCase()) {
    case 'bronze': return 'secondary';
    case 'silver': return 'default';
    case 'gold': return 'destructive';
    case 'platinum': return 'secondary';
    default: return 'default';
  }
}