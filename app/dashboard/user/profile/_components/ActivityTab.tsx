'use client';

import { BookOpen, Trophy, Award, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { ActivityItem } from './types';

interface ActivityTabProps {
  activities: ActivityItem[];
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'course_progress':
      return <BookOpen className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />;
    case 'course_completed':
    case 'chapter_completed':
      return <Trophy className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />;
    case 'certificate_earned':
      return <Award className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />;
    default:
      return <BookOpen className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />;
  }
}

export function ActivityTab({ activities }: ActivityTabProps) {
  return (
    <Card className="rounded-xl sm:rounded-2xl">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Your learning journey
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {activities.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b last:border-0"
              >
                <div className="h-8 w-8 xs:h-10 xs:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base break-words">
                    {activity.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {activity.timestamp}
                  </p>
                  {activity.progress !== undefined && activity.progress > 0 && (
                    <Progress
                      value={activity.progress}
                      className="h-1.5 sm:h-2 mt-1.5 sm:mt-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProfileEmptyState
            icon={Clock}
            title="No recent activity"
            description="Start a course to begin tracking your learning journey and progress."
          />
        )}
      </CardContent>
    </Card>
  );
}
