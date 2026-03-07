'use client';

import { Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProfileEmptyState } from './ProfileEmptyState';
import type { Skill } from './types';

interface SkillsTabProps {
  skills: Skill[];
}

export function SkillsTab({ skills }: SkillsTabProps) {
  if (skills.length === 0) {
    return (
      <Card className="rounded-xl sm:rounded-2xl">
        <CardContent className="p-0">
          <ProfileEmptyState
            icon={Zap}
            title="No skills tracked yet"
            description="Enroll in courses across different topics to build and track your skill profile."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl sm:rounded-2xl">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Skill Development</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Track your expertise across different technologies
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {skills.map((skill) => (
            <div key={skill.name} className="space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="font-semibold text-sm sm:text-base break-words">
                  {skill.name}
                </span>
                <Badge
                  variant={skill.level >= 70 ? 'default' : 'secondary'}
                  className="text-[10px] xs:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0"
                >
                  Level {Math.floor(skill.level / 20) + 1}
                </Badge>
              </div>
              <Progress value={skill.progress} className="h-2 sm:h-3" />
              <p className="text-[10px] xs:text-xs text-muted-foreground">
                {100 - skill.progress}% to next level
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
