'use client';

import { ChevronDown, Clock, BookOpen, Wrench, CheckCircle2, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CourseRecommendationCard } from './CourseRecommendationCard';
import { ProjectSuggestionCard } from './ProjectSuggestionCard';
import type { RoadmapMilestone, MatchedCourse } from '@/hooks/use-skill-roadmap-journey';

interface PhaseCardProps {
  milestone: RoadmapMilestone;
  isExpanded: boolean;
  onToggle: () => void;
  matchedCourses: Record<string, MatchedCourse>;
  hoursPerWeek?: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  COMPLETED: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500',
  },
  IN_PROGRESS: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-500',
  },
  AVAILABLE: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-500',
  },
  LOCKED: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    text: 'text-slate-400',
    ring: 'ring-slate-300',
  },
  SKIPPED: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    text: 'text-slate-400',
    ring: 'ring-slate-300',
  },
};

export function PhaseCard({
  milestone,
  isExpanded,
  onToggle,
  matchedCourses,
  hoursPerWeek = 10,
}: PhaseCardProps) {
  const style = STATUS_STYLES[milestone.status] ?? STATUS_STYLES.LOCKED;
  const resources = milestone.resources;
  const isLocked = milestone.status === 'LOCKED';
  const courses = resources?.courses ?? [];
  const projects = resources?.projects ?? [];
  const durationWeeks = resources?.durationWeeks ?? Math.ceil(milestone.estimatedHours / hoursPerWeek);

  return (
    <div className={cn(
      'rounded-2xl border-2 transition-all duration-300 overflow-hidden',
      isLocked ? 'opacity-60 border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700',
      isExpanded && !isLocked && 'ring-2 ring-offset-2 dark:ring-offset-slate-900',
      isExpanded && style.ring,
    )}>
      {/* Clickable Header */}
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={cn(
          'w-full p-4 sm:p-5 flex items-center gap-4 text-left transition-colors',
          !isLocked && 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
          isExpanded && style.bg,
        )}
      >
        {/* Phase Number Circle */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
          milestone.status === 'COMPLETED' && 'bg-emerald-500 text-white',
          milestone.status === 'IN_PROGRESS' && 'bg-gradient-to-br from-violet-500 to-purple-600 text-white animate-pulse',
          milestone.status === 'AVAILABLE' && 'bg-blue-500 text-white',
          isLocked && 'bg-slate-200 dark:bg-slate-700 text-slate-500',
        )}>
          {milestone.status === 'COMPLETED' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            milestone.order
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn('text-base font-semibold', isLocked ? 'text-slate-400' : 'text-slate-900 dark:text-white')}>
              {isLocked ? '🔒 ' : ''}{milestone.title}
            </h3>
            {resources?.bloomsLevel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {resources.bloomsLevel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" /> {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> ~{milestone.estimatedHours}h
            </span>
          </div>
        </div>

        {/* Progress / Expand */}
        {!isLocked && (
          <ChevronDown className={cn(
            'h-5 w-5 text-slate-400 transition-transform duration-200 flex-shrink-0',
            isExpanded && 'rotate-180'
          )} />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && !isLocked && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-800">
          {/* Description */}
          {milestone.description && (
            <p className="pt-4 text-sm text-slate-600 dark:text-slate-400">
              {milestone.description}
            </p>
          )}

          {/* Time Estimate */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <Clock className="h-4 w-4" />
            <span>
              ~{milestone.estimatedHours}h total &middot; At {hoursPerWeek}h/week = ~{durationWeeks} week{durationWeeks !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Skills */}
          {milestone.skills && milestone.skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" /> Skills to Learn
              </h4>
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
            </div>
          )}

          {/* Courses */}
          {courses.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> AI-Suggested Courses
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
                    matchedCourse={course.matchedCourseId ? matchedCourses[course.matchedCourseId] : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" /> Practice Projects
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
        </div>
      )}
    </div>
  );
}
