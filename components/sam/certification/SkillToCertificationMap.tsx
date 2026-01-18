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
    <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{skill.name}</span>
        <Badge variant="outline" className={cn('text-xs', levelConfig.color.replace('bg-', 'text-'))}>
          {levelConfig.label}
        </Badge>
      </div>

      {/* Level indicator */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Proficiency</span>
          <span>{skill.level}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', levelConfig.color)}
            style={{ width: `${skill.level}%` }}
          />
        </div>
      </div>

      {/* Related certifications */}
      {relatedCerts.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {relatedCerts.length} related cert{relatedCerts.length !== 1 ? 's' : ''}
            </span>
            {onViewCerts && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onViewCerts}>
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
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Award className="w-5 h-5 text-yellow-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm line-clamp-1">{cert.certificationName}</h4>
              <Badge variant="outline" className="shrink-0 ml-2">
                {cert.relevanceScore}% match
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-3">{cert.provider}</p>

            {/* Skills breakdown */}
            <div className="space-y-2">
              {/* Matching skills */}
              {cert.matchingSkills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cert.matchingSkills.slice(0, 3).map((skillName) => (
                    <TooltipProvider key={skillName}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            {skillName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          You have this skill at level {userSkills.get(skillName)?.level || 0}%
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {cert.matchingSkills.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2">
                      +{cert.matchingSkills.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Gap skills */}
              {cert.gapSkills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cert.gapSkills.slice(0, 3).map((skillName) => (
                    <TooltipProvider key={skillName}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-600">
                            <Target className="w-3 h-3" />
                            {skillName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Skill gap - needs development</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {cert.gapSkills.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2">
                      +{cert.gapSkills.length - 3} gaps
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Readiness bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Skill Readiness</span>
                <span className="font-medium">{matchPercent}%</span>
              </div>
              <Progress value={matchPercent} className="h-1.5" />
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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
    <div className="space-y-4">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{category.name}</h3>
          <Badge variant="secondary">{category.skills.length} skills</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Avg: {avgLevel}%</span>
          <Progress value={avgLevel} className="w-16 h-1.5" />
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
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Recommended Certifications</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
      // Fetch both skill assessments and certification recommendations
      const [skillsRes, certsRes] = await Promise.all([
        fetch('/api/sam/skill-assessments'),
        fetch('/api/sam/certification-pathways?limit=50'),
      ]);

      // Handle skills data - may not exist yet
      let skillsData: UserSkill[] = [];
      if (skillsRes.ok) {
        const skillsJson = await skillsRes.json();
        if (skillsJson.success && skillsJson.data?.assessments) {
          skillsData = skillsJson.data.assessments.map((a: { skillId: string; skillName: string; score: number }) => ({
            id: a.skillId,
            name: a.skillName,
            level: Math.round(a.score),
            category: 'General',
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
      const skillNameSet = new Set(skillsData.map((s) => s.name.toLowerCase()));

      for (const cert of certifications) {
        const matchingSkills = cert.skillsCovered.filter((s: string) =>
          skillNameSet.has(s.toLowerCase())
        );
        const gapSkills = cert.skillsCovered.filter(
          (s: string) => !skillNameSet.has(s.toLowerCase())
        );

        const mapping: CertificationMapping = {
          certificationId: cert.id,
          certificationName: cert.name,
          provider: cert.provider,
          relevanceScore: cert.matchScore,
          skillsCovered: cert.skillsCovered,
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
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading skill mappings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={fetchData}>
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
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Skill to Certification Map</CardTitle>
              <CardDescription>See how your skills connect to certifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 px-4 rounded-xl bg-muted/30">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Skill Data Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete skill assessments to see how your skills map to certifications
            </p>
            <Button variant="outline">
              <GraduationCap className="w-4 h-4 mr-2" />
              Take Skill Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Skill to Certification Map</CardTitle>
              <CardDescription>See how your skills connect to certifications</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-500/10 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">
              {categories.reduce((sum, c) => sum + c.skills.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Skills Tracked</div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/10 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">
              {categories.reduce((sum, c) => sum + c.certifications.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Matched Certs</div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
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
