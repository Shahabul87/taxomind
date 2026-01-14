'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Lightbulb,
  Rocket,
  Beaker,
  Sparkles,
  Target,
  Users,
  Clock,
  TrendingUp,
  Star,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Zap,
  Brain,
  Palette,
  Code2,
  FlaskConical,
  Atom,
  Loader2,
  Plus,
  ArrowRight,
  Trophy,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Experiment {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'ai' | 'collaboration' | 'gamification';
  status: 'idea' | 'prototype' | 'testing' | 'launched';
  progress: number;
  participants: number;
  successRate?: number;
  startDate: string;
  hypothesis: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  votes: number;
  author: string;
  tags: string[];
  createdAt: string;
  hasVoted: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  participants: number;
  deadline: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

interface InnovationLabProps {
  userId: string;
  className?: string;
}

export function InnovationLab({ userId, className }: InnovationLabProps) {
  const [activeTab, setActiveTab] = useState('experiments');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoadingRef = useRef(false);

  const fetchInnovationData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Simulated data - replace with actual API call
      // const response = await fetch('/api/sam/innovation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: 'getLabData', userId }),
      // });

      setExperiments([
        {
          id: '1',
          title: 'Adaptive Quiz Difficulty',
          description: 'AI-powered real-time difficulty adjustment based on learner performance',
          category: 'ai',
          status: 'testing',
          progress: 75,
          participants: 234,
          successRate: 87,
          startDate: '2024-01-15',
          hypothesis: 'Dynamic difficulty improves engagement by 30%',
        },
        {
          id: '2',
          title: 'Peer Teaching Rewards',
          description: 'Gamified system for incentivizing peer-to-peer knowledge sharing',
          category: 'collaboration',
          status: 'prototype',
          progress: 45,
          participants: 89,
          startDate: '2024-02-01',
          hypothesis: 'Teaching others improves retention by 40%',
        },
        {
          id: '3',
          title: 'Emotion-Aware Learning',
          description: 'Using facial cues to adapt content delivery and pacing',
          category: 'learning',
          status: 'idea',
          progress: 10,
          participants: 12,
          startDate: '2024-03-01',
          hypothesis: 'Emotional awareness reduces frustration by 50%',
        },
        {
          id: '4',
          title: 'Achievement Storylines',
          description: 'Narrative-driven progression paths with character development',
          category: 'gamification',
          status: 'launched',
          progress: 100,
          participants: 1250,
          successRate: 92,
          startDate: '2023-11-01',
          hypothesis: 'Story elements increase completion rates by 25%',
        },
      ]);

      setIdeas([
        {
          id: '1',
          title: 'Voice-Activated Study Mode',
          description: 'Hands-free learning for commuters and multitaskers',
          votes: 156,
          author: 'Alex Chen',
          tags: ['accessibility', 'mobile', 'audio'],
          createdAt: '2024-01-20',
          hasVoted: false,
        },
        {
          id: '2',
          title: 'Learning Buddy Matching',
          description: 'AI-powered study partner recommendations based on goals and style',
          votes: 142,
          author: 'Sarah Johnson',
          tags: ['social', 'ai', 'collaboration'],
          createdAt: '2024-01-18',
          hasVoted: true,
        },
        {
          id: '3',
          title: 'Micro-Certification System',
          description: 'Stackable credentials for specific skills and competencies',
          votes: 98,
          author: 'Michael Torres',
          tags: ['credentials', 'skills', 'career'],
          createdAt: '2024-01-22',
          hasVoted: false,
        },
      ]);

      setChallenges([
        {
          id: '1',
          title: 'Build a Learning Algorithm',
          description: 'Create an algorithm that personalizes content recommendations',
          reward: '500 XP + Innovation Badge',
          participants: 45,
          deadline: '2024-02-15',
          difficulty: 'advanced',
          category: 'Engineering',
        },
        {
          id: '2',
          title: 'Design a Study Dashboard',
          description: 'Create a visually appealing and functional study analytics view',
          reward: '300 XP + Designer Badge',
          participants: 78,
          deadline: '2024-02-10',
          difficulty: 'intermediate',
          category: 'Design',
        },
        {
          id: '3',
          title: 'Write Learning Tips',
          description: 'Contribute your best study techniques to help fellow learners',
          reward: '100 XP + Mentor Badge',
          participants: 234,
          deadline: '2024-02-28',
          difficulty: 'beginner',
          category: 'Content',
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load innovation data');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // userId will be used when API is implemented

  const handleVote = useCallback(async (ideaId: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              votes: idea.hasVoted ? idea.votes - 1 : idea.votes + 1,
              hasVoted: !idea.hasVoted,
            }
          : idea
      )
    );
  }, []);

  const handleJoinExperiment = useCallback(async (experimentId: string) => {
    setExperiments((prev) =>
      prev.map((exp) =>
        exp.id === experimentId ? { ...exp, participants: exp.participants + 1 } : exp
      )
    );
  }, []);

  const getCategoryIcon = (category: Experiment['category']) => {
    switch (category) {
      case 'learning':
        return Brain;
      case 'ai':
        return Atom;
      case 'collaboration':
        return Users;
      case 'gamification':
        return Trophy;
      default:
        return Lightbulb;
    }
  };

  const getCategoryColor = (category: Experiment['category']) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ai':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'collaboration':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'gamification':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusConfig = (status: Experiment['status']) => {
    switch (status) {
      case 'idea':
        return { icon: Lightbulb, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Idea' };
      case 'prototype':
        return { icon: Beaker, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Prototype' };
      case 'testing':
        return { icon: FlaskConical, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Testing' };
      case 'launched':
        return { icon: Rocket, color: 'text-green-500', bg: 'bg-green-100', label: 'Launched' };
      default:
        return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Unknown' };
    }
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-amber-100 text-amber-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Load data on mount
  useState(() => {
    fetchInnovationData();
  });

  if (isLoading && experiments.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-3 text-muted-foreground">Loading Innovation Lab...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" onClick={fetchInnovationData} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Innovation Lab</CardTitle>
              <CardDescription>Experiment, create, and shape the future of learning</CardDescription>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
            <Plus className="h-4 w-4 mr-2" />
            New Idea
          </Button>
        </div>

        {/* Lab Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Beaker className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {experiments.filter((e) => e.status === 'testing').length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Launched</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {experiments.filter((e) => e.status === 'launched').length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-600 font-medium">Ideas</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{ideas.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Participants</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {experiments.reduce((sum, e) => sum + e.participants, 0)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="experiments" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Experiments
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Challenges
            </TabsTrigger>
          </TabsList>

          {/* Experiments Tab */}
          <TabsContent value="experiments" className="space-y-4">
            {experiments.map((experiment) => {
              const CategoryIcon = getCategoryIcon(experiment.category);
              const statusConfig = getStatusConfig(experiment.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={experiment.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          getCategoryColor(experiment.category)
                        )}
                      >
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{experiment.title}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">{experiment.description}</p>
                      </div>
                    </div>
                    <Badge className={cn('flex items-center gap-1', statusConfig.bg, statusConfig.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Hypothesis */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Hypothesis</p>
                    <p className="text-sm text-gray-700 italic">&quot;{experiment.hypothesis}&quot;</p>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{experiment.progress}%</span>
                    </div>
                    <Progress value={experiment.progress} className="h-2" />
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {experiment.participants} participants
                      </span>
                      {experiment.successRate && (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          {experiment.successRate}% success
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={experiment.status === 'launched' ? 'outline' : 'default'}
                      onClick={() => handleJoinExperiment(experiment.id)}
                      disabled={experiment.status === 'launched'}
                    >
                      {experiment.status === 'launched' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Ideas Tab */}
          <TabsContent value="ideas" className="space-y-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{idea.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">{idea.description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {idea.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>by {idea.author}</span>
                      <span>•</span>
                      <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button
                    variant={idea.hasVoted ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVote(idea.id)}
                    className={cn(
                      'flex flex-col items-center min-w-[60px] h-auto py-2',
                      idea.hasVoted && 'bg-purple-500 hover:bg-purple-600'
                    )}
                  >
                    <Star
                      className={cn('h-5 w-5', idea.hasVoted ? 'fill-white' : 'fill-none')}
                    />
                    <span className="text-lg font-bold">{idea.votes}</span>
                  </Button>
                </div>
              </div>
            ))}

            {/* Submit Idea CTA */}
            <div className="p-6 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 text-center">
              <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">Have an idea?</h4>
              <p className="text-sm text-gray-500 mb-3">
                Share your thoughts and help shape the future of learning
              </p>
              <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-100">
                Submit Your Idea
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{challenge.description}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {challenge.category}
                  </Badge>
                </div>

                {/* Reward */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-medium text-amber-700">{challenge.reward}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {challenge.participants} joined
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Due {new Date(challenge.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
                    <Flame className="h-4 w-4 mr-1" />
                    Take Challenge
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default InnovationLab;
