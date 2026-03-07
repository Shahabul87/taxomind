'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BookOpen,
  Trophy,
  BarChart3,
  Zap,
  ChevronRight,
  Clock,
  Flame,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { UserProfile } from './types';

interface OverviewTabProps {
  profile: UserProfile;
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

const cardClass =
  'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl hover:shadow-xl transition-shadow duration-300';

function isPlaceholderUrl(url: string) {
  return !url || url.startsWith('/api/placeholder');
}

export function OverviewTab({ profile }: OverviewTabProps) {
  const router = useRouter();

  // Compute real analytics
  const avgProgress =
    profile.courses.length > 0
      ? Math.round(
          profile.courses.reduce((sum, c) => sum + c.progress, 0) / profile.courses.length
        )
      : 0;
  const completionRate =
    profile.coursesEnrolled > 0
      ? Math.round((profile.coursesCompleted / profile.coursesEnrolled) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {/* Continue Learning */}
      <Card className={cardClass}>
        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Continue Learning
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Pick up where you left off
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          {profile.courses.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {profile.courses.slice(0, 2).map((course) => (
                <div key={course.id} className="flex gap-2 sm:gap-3 md:gap-4">
                  <div className="relative w-20 h-14 xs:w-24 xs:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex-shrink-0">
                    {!isPlaceholderUrl(course.thumbnail) && (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm break-words">
                      {course.title}
                    </h4>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {course.completedChapters}/{course.totalChapters} chapters
                    </p>
                    <Progress value={course.progress} className="h-1.5 sm:h-2 mt-1.5 sm:mt-2" />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Browse our catalog and enroll in your first course to start learning."
              actionLabel="Browse Courses"
              onAction={() => router.push('/search')}
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className={cardClass}>
        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Recent Achievements
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Your latest accomplishments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {profile.achievements.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {profile.achievements.slice(0, 3).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm break-words">
                      {achievement.title}
                    </h4>
                    <p className="text-[10px] xs:text-xs text-muted-foreground break-words">
                      {achievement.description}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      getRarityColor(achievement.rarity),
                      'text-[9px] xs:text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0'
                    )}
                  >
                    {achievement.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              icon={Trophy}
              title="No achievements yet"
              description="Complete courses and hit milestones to earn badges and recognition."
            />
          )}
        </CardContent>
      </Card>

      {/* Learning Analytics - Real Data */}
      <Card className={cardClass}>
        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Learning Analytics
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Your learning progress
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {profile.coursesEnrolled > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                  <span>Overall Progress</span>
                  <span className="font-semibold">{avgProgress}%</span>
                </div>
                <Progress value={avgProgress} className="h-1.5 sm:h-2" />
              </div>
              <div className="pt-3 sm:pt-4 border-t">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-primary mt-1">
                      {completionRate}%
                    </div>
                    <div className="text-[10px] xs:text-xs text-muted-foreground">
                      Completion Rate
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-primary mt-1">
                      {profile.totalLearningHours}h
                    </div>
                    <div className="text-[10px] xs:text-xs text-muted-foreground">
                      Learning Hours
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-primary mt-1">
                      {profile.currentStreak}
                    </div>
                    <div className="text-[10px] xs:text-xs text-muted-foreground">
                      Day Streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ProfileEmptyState
              icon={BarChart3}
              title="No data yet"
              description="Enroll in a course to start tracking your learning analytics."
              actionLabel="Browse Courses"
              onAction={() => router.push('/search')}
            />
          )}
        </CardContent>
      </Card>

      {/* Top Skills */}
      <Card className={cardClass}>
        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Top Skills
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Your skill progression
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {profile.skills.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {profile.skills.slice(0, 5).map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                    <span className="break-words">{skill.name}</span>
                    <span className="font-semibold ml-2 flex-shrink-0">{skill.level}%</span>
                  </div>
                  <Progress value={skill.progress} className="h-1.5 sm:h-2" />
                </div>
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              icon={Zap}
              title="No skills tracked yet"
              description="Enroll in courses to build your skill profile across different topics."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
