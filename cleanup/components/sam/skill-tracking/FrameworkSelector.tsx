'use client';

/**
 * FrameworkSelector
 *
 * Displays the 6 supported skill frameworks (SFIA, ONET, ESCO, NICE, DREYFUS, CUSTOM)
 * and maps the user&apos;s proficiency to each framework&apos;s native levels.
 * Users can select a target framework to align their skill development.
 */

import { useState, useMemo } from 'react';
import {
  Shield,
  Globe,
  Briefcase,
  GraduationCap,
  Layers,
  Settings,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type SkillBuildFramework =
  | 'SFIA'
  | 'ONET'
  | 'ESCO'
  | 'NICE'
  | 'DREYFUS'
  | 'CUSTOM';

type ProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

interface FrameworkMapping {
  framework: SkillBuildFramework;
  code: string;
  name: string;
  level?: number;
  description?: string;
}

interface SkillWithFramework {
  id: string;
  skillName: string;
  compositeScore: number;
  proficiencyLevel: ProficiencyLevel;
  frameworkMappings?: FrameworkMapping[];
}

interface FrameworkSelectorProps {
  skills: SkillWithFramework[];
  activeFramework?: SkillBuildFramework;
  onFrameworkChange?: (framework: SkillBuildFramework) => void;
  onSetTarget?: (framework: SkillBuildFramework) => void;
  className?: string;
}

// ============================================================================
// Framework Metadata
// ============================================================================

interface FrameworkInfo {
  id: SkillBuildFramework;
  label: string;
  fullName: string;
  description: string;
  icon: typeof Shield;
  levels: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const FRAMEWORKS: FrameworkInfo[] = [
  {
    id: 'SFIA',
    label: 'SFIA',
    fullName: 'Skills Framework for the Information Age',
    description: 'International framework for IT skills and competencies',
    icon: Globe,
    levels: ['Follow', 'Assist', 'Apply', 'Enable', 'Ensure/Advise', 'Initiate/Influence', 'Set Strategy/Inspire'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'ONET',
    label: 'O*NET',
    fullName: 'O*NET (US Department of Labor)',
    description: 'US occupational framework with knowledge, skills, and abilities',
    icon: Briefcase,
    levels: ['Little/None', 'Some', 'Moderate', 'Considerable', 'Extensive', 'Expert', 'Master'],
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'ESCO',
    label: 'ESCO',
    fullName: 'European Skills, Competences, Qualifications',
    description: 'EU classification of skills, competences, and occupations',
    icon: Globe,
    levels: ['Foundation', 'Intermediate', 'Advanced', 'Highly Specialised'],
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
  {
    id: 'NICE',
    label: 'NICE',
    fullName: 'NICE Cybersecurity Workforce Framework',
    description: 'US NIST framework for cybersecurity roles and competencies',
    icon: Shield,
    levels: ['Entry', 'Intermediate', 'Advanced', 'Expert', 'Senior/Executive'],
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  {
    id: 'DREYFUS',
    label: 'Dreyfus',
    fullName: 'Dreyfus Model of Skill Acquisition',
    description: 'Academic model of progression from novice to expert',
    icon: GraduationCap,
    levels: ['Novice', 'Advanced Beginner', 'Competent', 'Proficient', 'Expert'],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'CUSTOM',
    label: 'Custom',
    fullName: 'Custom Framework',
    description: 'Organization-specific proficiency framework',
    icon: Settings,
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-800',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
];

const PROFICIENCY_THRESHOLDS: Record<ProficiencyLevel, number> = {
  NOVICE: 0,
  BEGINNER: 15,
  COMPETENT: 35,
  PROFICIENT: 55,
  ADVANCED: 70,
  EXPERT: 85,
  STRATEGIST: 95,
};

const LEVEL_LABELS: Record<ProficiencyLevel, string> = {
  NOVICE: 'Novice',
  BEGINNER: 'Beginner',
  COMPETENT: 'Competent',
  PROFICIENT: 'Proficient',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
  STRATEGIST: 'Strategist',
};

const LEVEL_COLORS: Record<ProficiencyLevel, string> = {
  NOVICE: 'text-slate-500 dark:text-slate-400',
  BEGINNER: 'text-blue-600 dark:text-blue-400',
  COMPETENT: 'text-cyan-600 dark:text-cyan-400',
  PROFICIENT: 'text-emerald-600 dark:text-emerald-400',
  ADVANCED: 'text-violet-600 dark:text-violet-400',
  EXPERT: 'text-amber-600 dark:text-amber-400',
  STRATEGIST: 'text-rose-600 dark:text-rose-400',
};

// ============================================================================
// Framework Level Mapping
// ============================================================================

/**
 * Map internal composite score (0-100) to a framework&apos;s native level label.
 */
function mapScoreToFrameworkLevel(
  score: number,
  framework: FrameworkInfo
): { levelIndex: number; levelLabel: string; progressInLevel: number } {
  const numLevels = framework.levels.length;
  const rangePerLevel = 100 / numLevels;
  const clampedScore = Math.max(0, Math.min(100, score));
  const levelIndex = Math.min(
    Math.floor(clampedScore / rangePerLevel),
    numLevels - 1
  );
  const levelStart = levelIndex * rangePerLevel;
  const progressInLevel = Math.round(
    ((clampedScore - levelStart) / rangePerLevel) * 100
  );

  return {
    levelIndex,
    levelLabel: framework.levels[levelIndex],
    progressInLevel: Math.min(100, progressInLevel),
  };
}

// ============================================================================
// Component
// ============================================================================

export function FrameworkSelector({
  skills,
  activeFramework,
  onFrameworkChange,
  onSetTarget,
  className,
}: FrameworkSelectorProps) {
  const [selectedFramework, setSelectedFramework] = useState<SkillBuildFramework>(
    activeFramework ?? 'DREYFUS'
  );

  const frameworkInfo = useMemo(
    () => FRAMEWORKS.find((f) => f.id === selectedFramework) ?? FRAMEWORKS[4],
    [selectedFramework]
  );

  // Map skills to the selected framework
  const mappedSkills = useMemo(() => {
    return skills.map((skill) => {
      // Check if there is a stored framework mapping for this skill
      const storedMapping = skill.frameworkMappings?.find(
        (m) => m.framework === selectedFramework
      );

      const frameworkLevel = mapScoreToFrameworkLevel(
        skill.compositeScore,
        frameworkInfo
      );

      return {
        ...skill,
        frameworkLevel: storedMapping?.name ?? frameworkLevel.levelLabel,
        frameworkCode: storedMapping?.code ?? '',
        frameworkLevelIndex: storedMapping?.level ?? frameworkLevel.levelIndex,
        progressInLevel: frameworkLevel.progressInLevel,
      };
    });
  }, [skills, selectedFramework, frameworkInfo]);

  // Level distribution for the selected framework
  const levelDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    for (const level of frameworkInfo.levels) {
      distribution[level] = 0;
    }
    for (const skill of mappedSkills) {
      const level = skill.frameworkLevel;
      if (distribution[level] !== undefined) {
        distribution[level]++;
      }
    }
    return distribution;
  }, [mappedSkills, frameworkInfo]);

  const handleFrameworkSelect = (fw: SkillBuildFramework) => {
    setSelectedFramework(fw);
    onFrameworkChange?.(fw);
  };

  const FrameworkIcon = frameworkInfo.icon;

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              Framework View
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Map your skills to industry frameworks
            </CardDescription>
          </div>
          {onSetTarget && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onSetTarget(selectedFramework)}
            >
              Set as Target
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Framework Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FRAMEWORKS.map((fw) => {
            const isActive = fw.id === selectedFramework;
            const Icon = fw.icon;
            return (
              <button
                key={fw.id}
                onClick={() => handleFrameworkSelect(fw.id)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  'border',
                  isActive
                    ? `${fw.bgColor} ${fw.color} ${fw.borderColor}`
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
                title={fw.fullName}
              >
                <Icon className="w-3 h-3" />
                {fw.label}
                {isActive && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Framework Description */}
        <div className={cn('rounded-lg p-3 border', frameworkInfo.bgColor, frameworkInfo.borderColor)}>
          <div className="flex items-center gap-2 mb-1">
            <FrameworkIcon className={cn('w-4 h-4', frameworkInfo.color)} />
            <span className={cn('text-sm font-medium', frameworkInfo.color)}>
              {frameworkInfo.fullName}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {frameworkInfo.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {frameworkInfo.levels.map((level, idx) => (
              <Badge
                key={level}
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0',
                  levelDistribution[level] > 0
                    ? `${frameworkInfo.color} ${frameworkInfo.borderColor}`
                    : 'text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                )}
              >
                L{idx + 1}: {level}
                {levelDistribution[level] > 0 && (
                  <span className="ml-1 font-bold">{levelDistribution[level]}</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Skill Mappings */}
        {mappedSkills.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No skills tracked yet. Start practicing to see framework mappings.
          </p>
        ) : (
          <div className="space-y-2">
            {mappedSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Skill Name + Internal Level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {skill.skillName}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn('text-[9px] px-1 py-0 shrink-0', LEVEL_COLORS[skill.proficiencyLevel])}
                    >
                      {LEVEL_LABELS[skill.proficiencyLevel]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    <span className={cn('text-xs font-medium', frameworkInfo.color)}>
                      {skill.frameworkLevel}
                    </span>
                    {skill.frameworkCode && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        ({skill.frameworkCode})
                      </span>
                    )}
                  </div>
                </div>

                {/* Score + Progress */}
                <div className="flex flex-col items-end gap-1 w-20 shrink-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {Math.round(skill.compositeScore)}
                  </span>
                  <Progress
                    value={skill.progressInLevel}
                    className="h-1.5 w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FrameworkSelector;
