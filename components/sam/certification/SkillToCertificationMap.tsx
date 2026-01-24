'use client';

/**
 * SkillToCertificationMap Component
 *
 * Visualizes the relationship between user skills and potential certifications.
 * Shows skill gaps, certification pathways, and progression recommendations.
 *
 * Features:
 * - Interactive skill-to-certification mapping
 * - Visual skill level indicators
 * - Certification pathway suggestions
 * - Gap analysis visualization
 *
 * @module components/sam/certification
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  Target,
  Zap,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface UserSkill {
  id: string;
  name: string;
  level: number; // 0-100
  category: string;
}

interface CertificationMapping {
  certificationId: string;
  certificationName: string;
  provider: string;
  relevanceScore: number;
  skillsCovered: string[];
  requiredLevel: number;
  matchingSkills: string[];
  gapSkills: string[];
}

interface SkillCategory {
  name: string;
  skills: UserSkill[];
  certifications: CertificationMapping[];
}

interface SkillToCertificationMapProps {
  className?: string;
  userId?: string;
  onCertificationSelect?: (certId: string) => void;
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEVEL_CONFIG: Record<string, { color: string; label: string; min: number; max: number }> = {
  novice: { color: 'bg-red-500', label: 'Novice', min: 0, max: 25 },
  beginner: { color: 'bg-orange-500', label: 'Beginner', min: 26, max: 50 },
  intermediate: { color: 'bg-yellow-500', label: 'Intermediate', min: 51, max: 75 },
  advanced: { color: 'bg-green-500', label: 'Advanced', min: 76, max: 90 },
  expert: { color: 'bg-blue-500', label: 'Expert', min: 91, max: 100 },
};

function getLevelConfig(level: number) {
  if (level <= 25) return LEVEL_CONFIG.novice;
  if (level <= 50) return LEVEL_CONFIG.beginner;
  if (level <= 75) return LEVEL_CONFIG.intermediate;
  if (level <= 90) return LEVEL_CONFIG.advanced;
  return LEVEL_CONFIG.expert;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Individual skill card with level indicator
 */
function SkillCard({
  skill,
  relatedCerts,
  onViewCerts,
}: {
  skill: UserSkill;
  relatedCerts: CertificationMapping[];
  onViewCerts?: () => void;
}) {
  const levelConfig = getLevelConfig(skill.level);

  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm text-slate-900 dark:text-white">{skill.name}</span>
        <Badge variant="outline" className={cn('text-xs font-medium border-2', levelConfig.color.replace('bg-', 'text-').replace('text-', 'border-'))}>
          {levelConfig.label}
        </Badge>
      </div>

      {/* Level indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
          <span className="font-medium">Proficiency</span>
          <span className="font-bold">{skill.level}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', levelConfig.color)}
            style={{ width: `${skill.level}%` }}
          />
        </div>
      </div>

      {/* Related certifications */}
      {relatedCerts.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {relatedCerts.length} related cert{relatedCerts.length !== 1 ? 's' : ''}
            </span>
            {onViewCerts && (
              <Button variant="ghost" size="sm" className="h-7 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700" onClick={onViewCerts}>
                View <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Certification pathway card showing skill connections
 */
function CertificationPathwayCard({
  cert,
  userSkills,
  onSelect,
}: {
  cert: CertificationMapping;
  userSkills: Map<string, UserSkill>;
  onSelect?: () => void;
}) {
  const matchPercent = Math.round(
    (cert.matchingSkills.length / (cert.matchingSkills.length + cert.gapSkills.length)) * 100
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{cert.certificationName}</h4>
              <Badge variant="outline" className="shrink-0 ml-2 font-semibold border-2">
                {cert.relevanceScore}% match
              </Badge>
            </div>

            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-4">{cert.provider}</p>

            {/* Skills breakdown */}
            <div className="space-y-3">
              {/* Matching skills */}
              {cert.matchingSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cert.matchingSkills.slice(0, 3).map((skillName) => (
                    <TooltipProvider key={skillName}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {skillName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white">
                          You have this skill at level {userSkills.get(skillName)?.level || 0}%
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {cert.matchingSkills.length > 3 && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1">
                      +{cert.matchingSkills.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Gap skills */}
              {cert.gapSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cert.gapSkills.slice(0, 3).map((skillName) => (
                    <TooltipProvider key={skillName}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                            <Target className="w-3.5 h-3.5" />
                            {skillName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white">Skill gap - needs development</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {cert.gapSkills.length > 3 && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1">
                      +{cert.gapSkills.length - 3} gaps
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Readiness bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-slate-600 dark:text-slate-300">Skill Readiness</span>
                <span className="font-bold text-slate-900 dark:text-white">{matchPercent}%</span>
              </div>
              <Progress value={matchPercent} className="h-2 bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skill category section
 */
function SkillCategorySection({
  category,
  onCertificationSelect,
}: {
  category: SkillCategory;
  onCertificationSelect?: (certId: string) => void;
}) {
  const avgLevel = category.skills.length > 0
    ? Math.round(category.skills.reduce((sum, s) => sum + s.level, 0) / category.skills.length)
    : 0;

  const skillMap = new Map(category.skills.map((s) => [s.name, s]));

  return (
    <div className="space-y-5">
      {/* Category header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{category.name}</h3>
          <Badge variant="secondary" className="font-semibold border-2">{category.skills.length} skills</Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">Avg: {avgLevel}%</span>
          <Progress value={avgLevel} className="w-20 h-2 bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {category.skills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            relatedCerts={category.certifications.filter((c) =>
              c.skillsCovered.includes(skill.name)
            )}
          />
        ))}
      </div>

      {/* Related certifications */}
      {category.certifications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Recommended Certifications</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {category.certifications.slice(0, 4).map((cert) => (
              <CertificationPathwayCard
                key={cert.certificationId}
                cert={cert}
                userSkills={skillMap}
                onSelect={() => onCertificationSelect?.(cert.certificationId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SkillToCertificationMap({
  className,
  userId,
  onCertificationSelect,
  compact = false,
}: SkillToCertificationMapProps) {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // Fetch skills and certification mappings
  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch both skill profiles and certification recommendations
      const [skillsRes, certsRes] = await Promise.all([
        fetch('/api/sam/skill-build-track?includeDecayRisks=true'),
        fetch('/api/sam/certification-pathways?limit=50'),
      ]);

      // Handle skills data - may not exist yet
      let skillsData: UserSkill[] = [];
      if (skillsRes.ok) {
        const skillsJson = await skillsRes.json();
        if (skillsJson.success && skillsJson.data?.profiles) {
          skillsData = skillsJson.data.profiles.map((p: { skillId: string; skillName: string; currentLevel: string; compositeScore: number; category: string }) => ({
            id: p.skillId,
            name: p.skillName,
            level: Math.round(p.compositeScore),
            category: p.category || 'General',
          }));
        }
      }

      // Handle certifications data
      if (!certsRes.ok) {
        throw new Error('Failed to fetch certifications');
      }

      const certsJson = await certsRes.json();
      const certifications = certsJson.data?.recommendations || [];

      // Build skill-to-certification mappings
      const categoryMap = new Map<string, SkillCategory>();

      // Group skills by category
      for (const skill of skillsData) {
        const cat = skill.category || 'General';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { name: cat, skills: [], certifications: [] });
        }
        categoryMap.get(cat)!.skills.push(skill);
      }

      // Map certifications to categories
      const skillNameSet = new Set(skillsData.map((s) => s.name?.toLowerCase()).filter(Boolean));

      for (const cert of certifications) {
        // Safely handle skillsCovered - may be undefined or contain undefined elements
        const skillsCovered: string[] = Array.isArray(cert.skillsCovered)
          ? cert.skillsCovered.filter((s: unknown): s is string => typeof s === 'string')
          : [];

        const matchingSkills = skillsCovered.filter((s) =>
          skillNameSet.has(s.toLowerCase())
        );
        const gapSkills = skillsCovered.filter(
          (s) => !skillNameSet.has(s.toLowerCase())
        );

        const mapping: CertificationMapping = {
          certificationId: cert.id || `cert-${Math.random().toString(36).slice(2)}`,
          certificationName: cert.name || 'Unknown Certification',
          provider: cert.provider || 'Unknown Provider',
          relevanceScore: cert.matchScore || 0,
          skillsCovered,
          requiredLevel: 70,
          matchingSkills,
          gapSkills,
        };

        // Add to relevant categories
        const certCategory = cert.category || 'OTHER';
        if (!categoryMap.has(certCategory)) {
          categoryMap.set(certCategory, { name: certCategory, skills: [], certifications: [] });
        }
        categoryMap.get(certCategory)!.certifications.push(mapping);
      }

      // If no skills yet, create categories from certifications
      if (skillsData.length === 0) {
        for (const cert of certifications) {
          const cat = cert.category || 'OTHER';
          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { name: cat, skills: [], certifications: [] });
          }
        }
      }

      setCategories(Array.from(categoryMap.values()).filter((c) => c.certifications.length > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill mappings');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return (
      <Card className={cn("bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700", className)}>
        <CardContent className="flex items-center justify-center py-12 bg-white dark:bg-slate-800">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading skill mappings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4 bg-white dark:bg-slate-800">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{error}</p>
          <Button variant="outline" onClick={fetchData} className="border-2 hover:bg-slate-100 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <Card className={cn("bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700", className)}>
        <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white font-bold">Skill to Certification Map</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">See how your skills connect to certifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-800">
          <div className="text-center py-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700">
            <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No Skill Data Yet</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6">
              Complete skill assessments to see how your skills map to certifications
            </p>
            <Button variant="outline" className="border-2 hover:bg-slate-100 dark:hover:bg-slate-700">
              <GraduationCap className="w-4 h-4 mr-2" />
              Take Skill Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-white font-bold">Skill to Certification Map</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">See how your skills connect to certifications</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData} className="hover:bg-slate-100 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 bg-white dark:bg-slate-800 p-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center border-2 border-blue-200 dark:border-blue-800">
            <Star className="w-7 h-7 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {categories.reduce((sum, c) => sum + c.skills.length, 0)}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">Skills Tracked</div>
          </div>
          <div className="p-5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-center border-2 border-yellow-200 dark:border-yellow-800">
            <Award className="w-7 h-7 mx-auto mb-3 text-yellow-600 dark:text-yellow-400" />
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {categories.reduce((sum, c) => sum + c.certifications.length, 0)}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">Matched Certs</div>
          </div>
          <div className="p-5 rounded-xl bg-green-50 dark:bg-green-900/20 text-center border-2 border-green-200 dark:border-green-800">
            <TrendingUp className="w-7 h-7 mx-auto mb-3 text-green-600 dark:text-green-400" />
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{categories.length}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">Categories</div>
          </div>
        </div>

        {/* Categories */}
        {compact ? (
          <div className="space-y-4">
            {categories.slice(0, 2).map((category) => (
              <SkillCategorySection
                key={category.name}
                category={category}
                onCertificationSelect={onCertificationSelect}
              />
            ))}
            {categories.length > 2 && (
              <div className="text-center pt-2">
                <Button variant="outline">
                  View All {categories.length} Categories
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <SkillCategorySection
                key={category.name}
                category={category}
                onCertificationSelect={onCertificationSelect}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SkillToCertificationMap;
