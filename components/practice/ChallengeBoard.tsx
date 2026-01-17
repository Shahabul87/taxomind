'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trophy, Swords, Users, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChallengeCard, type ChallengeCardProps } from './ChallengeCard';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

type Challenge = ChallengeCardProps['challenge'];

interface ChallengeBoardProps {
  onCreateChallenge?: () => void;
  className?: string;
}

type TabValue = 'available' | 'joined' | 'created';
type ChallengeTypeFilter = 'all' | 'INDIVIDUAL' | 'GROUP' | 'COMPETITION' | 'COMMUNITY';

// ============================================================================
// COMPONENT
// ============================================================================

export function ChallengeBoard({
  onCreateChallenge,
  className,
}: ChallengeBoardProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('available');
  const [typeFilter, setTypeFilter] = useState<ChallengeTypeFilter>('all');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isFetchingRef = useRef(false);

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      let url = '/api/sam/practice/challenges?';

      if (activeTab === 'joined') {
        url += 'userChallenges=true';
      } else if (activeTab === 'created') {
        url += 'createdByMe=true';
      } else {
        url += 'status=ACTIVE';
      }

      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setChallenges(result.data.challenges);
      } else {
        toast.error(result.error ?? 'Failed to fetch challenges');
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to fetch challenges');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [activeTab, typeFilter]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Handle join challenge
  const handleJoin = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/sam/practice/challenges/${challengeId}/join`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Successfully joined the challenge!');
        fetchChallenges();
      } else {
        toast.error(result.error ?? 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    }
  };

  // Handle leave challenge
  const handleLeave = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/sam/practice/challenges/${challengeId}/leave`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Left the challenge');
        fetchChallenges();
      } else {
        toast.error(result.error ?? 'Failed to leave challenge');
      }
    } catch (error) {
      console.error('Error leaving challenge:', error);
      toast.error('Failed to leave challenge');
    }
  };

  // Handle view details
  const handleViewDetails = (challengeId: string) => {
    // Navigate to challenge detail page
    window.location.href = `/practice/challenges/${challengeId}`;
  };

  // Get type icon
  const getTypeIcon = (type: ChallengeTypeFilter) => {
    switch (type) {
      case 'COMPETITION':
        return <Swords className="h-4 w-4" />;
      case 'GROUP':
      case 'COMMUNITY':
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Practice Challenges
          </CardTitle>
          {onCreateChallenge && (
            <Button onClick={onCreateChallenge} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Challenge
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="joined">Joined</TabsTrigger>
              <TabsTrigger value="created">Created</TabsTrigger>
            </TabsList>

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ChallengeTypeFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INDIVIDUAL">
                  <span className="flex items-center gap-2">
                    {getTypeIcon('INDIVIDUAL')}
                    Individual
                  </span>
                </SelectItem>
                <SelectItem value="GROUP">
                  <span className="flex items-center gap-2">
                    {getTypeIcon('GROUP')}
                    Group
                  </span>
                </SelectItem>
                <SelectItem value="COMPETITION">
                  <span className="flex items-center gap-2">
                    {getTypeIcon('COMPETITION')}
                    Competition
                  </span>
                </SelectItem>
                <SelectItem value="COMMUNITY">
                  <span className="flex items-center gap-2">
                    {getTypeIcon('COMMUNITY')}
                    Community
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="available" className="mt-0">
                {challenges.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active challenges available</p>
                    <p className="text-sm">Check back later or create your own!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {challenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="joined" className="mt-0">
                {challenges.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You haven&apos;t joined any challenges yet</p>
                    <p className="text-sm">Browse available challenges to get started!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {challenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onLeave={handleLeave}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="created" className="mt-0">
                {challenges.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You haven&apos;t created any challenges</p>
                    {onCreateChallenge && (
                      <Button variant="outline" onClick={onCreateChallenge} className="mt-4">
                        Create Your First Challenge
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {challenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ChallengeBoard;
