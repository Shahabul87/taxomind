'use client';

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { Achievement } from './types';

interface AchievementsTabProps {
  achievements: Achievement[];
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common':
      return 'bg-gray-500';
    case 'rare':
      return 'bg-blue-500';
    case 'epic':
      return 'bg-purple-500';
    case 'legendary':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

export function AchievementsTab({ achievements }: AchievementsTabProps) {
  if (achievements.length === 0) {
    return (
      <Card className="rounded-xl sm:rounded-2xl">
        <CardContent className="p-0">
          <ProfileEmptyState
            icon={Trophy}
            title="No achievements yet"
            description="Complete courses, maintain streaks, and hit milestones to earn achievements and badges."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement) => (
        <Card
          key={achievement.id}
          className="hover:shadow-lg transition-shadow rounded-xl sm:rounded-2xl"
        >
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="text-4xl sm:text-5xl">{achievement.icon}</div>
              <div>
                <h3 className="font-bold text-sm sm:text-base break-words">
                  {achievement.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                  {achievement.description}
                </p>
              </div>
              <Badge
                className={cn(
                  getRarityColor(achievement.rarity),
                  'text-[10px] xs:text-xs px-2 sm:px-3 py-0.5 sm:py-1'
                )}
              >
                {achievement.rarity}
              </Badge>
              <p className="text-[10px] xs:text-xs text-muted-foreground">
                Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
