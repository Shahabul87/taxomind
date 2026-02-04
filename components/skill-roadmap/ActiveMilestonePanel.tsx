'use client';

import { Clock, BookOpen, Wrench, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SkillDimensionRadar } from './SkillDimensionRadar';
import { CourseRecommendationCard } from './CourseRecommendationCard';
import { ProjectSuggestionCard } from './ProjectSuggestionCard';
import type { RoadmapMilestone, MatchedCourse } from '@/hooks/use-skill-roadmap-journey';

interface ActiveMilestonePanelProps {
  milestone: RoadmapMilestone;
  matchedCourses: Record<string, MatchedCourse>;
  /** Current skill dimension scores (from SkillBuildProfile) */
  skillScores?: {
    mastery: number;
    retention: number;
    application: number;
    confidence: number;
    calibration: number;
  };
  /** Practice hours logged vs target for this phase */
  practiceHoursLogged?: number;
  hoursPerWeek?: number;
  onComplete: () => void;
  isUpdating?: boolean;
}

/**
 * Detail panel for the currently active milestone.
 * Shows:
 * - CourseActionList (enroll/create courses)
 * - PracticeGoalTracker (hours logged vs target)
 * - SkillDimensionRadar (5-dimension recharts radar)
 */
export function ActiveMilestonePanel({
  milestone,
  matchedCourses,
  skillScores,
  practiceHoursLogged = 0,
  hoursPerWeek = 10,
  onComplete,
  isUpdating = false,
}: ActiveMilestonePanelProps) {
  const resources = milestone.resources;
  const courses = resources?.courses ?? [];
  const projects = resources?.projects ?? [];
  const durationWeeks = resources?.durationWeeks ?? Math.ceil(milestone.estimatedHours / hoursPerWeek);

  const practicePercent = milestone.estimatedHours > 0
    ? Math.min(100, Math.round((practiceHoursLogged / milestone.estimatedHours) * 100))
    : 0;

  return (
    <div className="space-y-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 shadow-lg ring-2 ring-violet-500/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-0 text-xs">
              Phase {milestone.order}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {resources?.bloomsLevel ?? 'APPLY'}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {milestone.title}
          </h3>
          {milestone.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {milestone.description}
            </p>
          )}
        </div>

        <Button
          size="sm"
          onClick={onComplete}
          disabled={isUpdating}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-lg flex-shrink-0"
        >
          {isUpdating ? 'Updating...' : 'Mark Complete'}
        </Button>
      </div>

      {/* Practice Goal Tracker */}
      <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-violet-500" />
            Practice Progress
          </h4>
          <span className="text-xs text-slate-500">
            {practiceHoursLogged}h / {milestone.estimatedHours}h
          </span>
        </div>
        <Progress value={practicePercent} className="h-2" />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{practicePercent}% complete</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{durationWeeks} week{durationWeeks !== 1 ? 's' : ''} at {hoursPerWeek}h/week
          </span>
        </div>
      </div>

      {/* Skill Dimension Radar */}
      {skillScores && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Skill Dimensions
          </h4>
          <SkillDimensionRadar
            mastery={skillScores.mastery}
            retention={skillScores.retention}
            application={skillScores.application}
            confidence={skillScores.confidence}
            calibration={skillScores.calibration}
            height={220}
          />
        </div>
      )}

      {/* Course Action List */}
      {courses.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Courses ({courses.length})
          </h4>
          <div className="space-y-2">
            {courses.map((course, i) => (
              <CourseRecommendationCard
                key={i}
                title={course.title}
                description={course.description}
                difficulty={course.difficulty}
                estimatedHours={course.estimatedHours}
                reason={course.reason}
                matchedCourseId={course.matchedCourseId}
                matchedCourse={
                  course.matchedCourseId
                    ? matchedCourses[course.matchedCourseId]
                    : null
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Practice Projects */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Projects ({projects.length})
          </h4>
          <div className="space-y-2">
            {projects.map((project, i) => (
              <ProjectSuggestionCard
                key={i}
                title={project.title}
                description={project.description}
                difficulty={project.difficulty}
                estimatedHours={project.estimatedHours}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assessment Criteria */}
      {resources?.assessmentCriteria && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
          <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
            Mastery Criteria
          </h4>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {resources.assessmentCriteria}
          </p>
        </div>
      )}

      {/* Skills to learn */}
      {milestone.skills && milestone.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {milestone.skills.map((skill, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-xs rounded-full"
            >
              {skill.skillName} &rarr; {skill.targetLevel}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
