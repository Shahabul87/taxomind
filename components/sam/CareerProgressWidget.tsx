'use client';

/**
 * CareerProgressWidget Component
 *
 * Career development dashboard showing certification progress, portfolio highlights,
 * and market readiness insights.
 *
 * Features:
 * - Certification tracking and recommendations
 * - Portfolio project showcase
 * - Career readiness score
 * - Job market alignment
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Award,
  Briefcase,
  FolderOpen,
  TrendingUp,
  GraduationCap,
  Clock,
  Target,
  RefreshCw,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Star,
  Plus,
  Sparkles,
  BarChart3,
  Building,
  Calendar,
  Zap,
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

interface CertificationRecommendation {
  id: string;
  name: string;
  provider: string;
  category: string;
  difficulty: string;
  matchScore: number;
  readinessScore: number;
  status: string;
  studyProgress?: number;
}

interface PortfolioProject {
  id: string;
  title: string;
  type: string;
  skills: string[];
  isPublic: boolean;
  createdAt: string;
}

interface PortfolioStats {
  totalProjects: number;
  publicProjects: number;
  totalSkills: number;
  totalCertifications: number;
}

interface CareerProgressData {
  certifications: {
    recommendations: CertificationRecommendation[];
    inProgress: CertificationRecommendation[];
    completed: CertificationRecommendation[];
    stats: {
      total: number;
      matchScore: number;
      readinessScore: number;
      inProgressCount: number;
    };
  };
  portfolio: {
    projects: PortfolioProject[];
    stats: PortfolioStats;
    settings: {
      isPublic: boolean;
      title: string;
    } | null;
  };
  careerReadinessScore: number;
  lastUpdated: string;
}

interface CareerProgressWidgetProps {
  className?: string;
  compact?: boolean;
  onViewCertifications?: () => void;
  onViewPortfolio?: () => void;
  onAddProject?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  NOT_STARTED: { color: 'text-muted-foreground bg-muted', label: 'Not Started' },
  IN_PROGRESS: { color: 'text-blue-600 bg-blue-500/10', label: 'In Progress' },
  COMPLETED: { color: 'text-green-600 bg-green-500/10', label: 'Completed' },
  EXPIRED: { color: 'text-red-600 bg-red-500/10', label: 'Expired' },
};

const DIFFICULTY_CONFIG: Record<string, { color: string }> = {
  beginner: { color: 'text-green-600 border-green-500/30 bg-green-500/5' },
  intermediate: { color: 'text-yellow-600 border-yellow-500/30 bg-yellow-500/5' },
  advanced: { color: 'text-orange-600 border-orange-500/30 bg-orange-500/5' },
  expert: { color: 'text-red-600 border-red-500/30 bg-red-500/5' },
};

const PROJECT_TYPE_ICONS: Record<string, typeof FolderOpen> = {
  personal: FolderOpen,
  course: GraduationCap,
  open_source: ExternalLink,
  professional: Briefcase,
  hackathon: Zap,
  research: BarChart3,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CertificationCard({
  cert,
  showProgress = false,
}: {
  cert: CertificationRecommendation;
  showProgress?: boolean;
}) {
  const statusConfig = STATUS_CONFIG[cert.status] || STATUS_CONFIG.NOT_STARTED;
  const difficultyConfig = DIFFICULTY_CONFIG[cert.difficulty] || DIFFICULTY_CONFIG.intermediate;

  return (
    <div className="p-3 rounded-xl bg-card border hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
          <Award className="w-5 h-5 text-yellow-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">{cert.name}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Building className="w-3 h-3" />
            <span>{cert.provider}</span>
            <span>•</span>
            <Badge variant="outline" className={cn('text-xs capitalize', difficultyConfig.color)}>
              {cert.difficulty}
            </Badge>
          </div>

          {showProgress && cert.studyProgress !== undefined && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Study Progress</span>
                <span className="font-medium">{cert.studyProgress}%</span>
              </div>
              <Progress value={cert.studyProgress} className="h-1.5" />
            </div>
          )}

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span className="font-medium">{cert.matchScore}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Match Score - How well this cert matches your goals</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="font-medium">{cert.readinessScore}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Readiness Score - Your current preparation level</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Badge className={cn('ml-auto text-xs', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  const Icon = PROJECT_TYPE_ICONS[project.type] || FolderOpen;

  return (
    <div className="p-3 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{project.title}</span>
            {project.isPublic ? (
              <Badge variant="secondary" className="text-xs">Public</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Private</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            {project.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-xs rounded-full bg-background border"
              >
                {skill}
              </span>
            ))}
            {project.skills.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{project.skills.length - 3} more
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function CareerReadinessGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-blue-500';
    if (s >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Developing';
    return 'Needs Work';
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-muted stroke-current"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={cn('stroke-current', getColor(score))}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${score}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', getColor(score))}>{score}%</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold">Career Readiness</span>
        </div>
        <p className={cn('text-sm font-medium', getColor(score))}>{getLabel(score)}</p>
        <p className="text-xs text-muted-foreground">Based on skills, certs &amp; portfolio</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof Award;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 text-center">
      <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {subtext && <div className="text-xs text-primary mt-0.5">{subtext}</div>}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CareerProgressWidget({
  className,
  compact = false,
  onViewCertifications,
  onViewPortfolio,
  onAddProject,
}: CareerProgressWidgetProps) {
  const [data, setData] = useState<CareerProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch both certifications and portfolio data in parallel
      const [certRes, portfolioRes] = await Promise.all([
        fetch('/api/sam/certification-pathways?includeInProgress=true&limit=5'),
        fetch('/api/sam/portfolio'),
      ]);

      if (!certRes.ok || !portfolioRes.ok) {
        throw new Error('Failed to fetch career data');
      }

      const certData = await certRes.json();
      const portfolioData = await portfolioRes.json();

      // Process certification data
      const recommendations = certData.data?.recommendations || [];
      const inProgress = recommendations.filter(
        (r: CertificationRecommendation) => r.status === 'IN_PROGRESS'
      );
      const completed = recommendations.filter(
        (r: CertificationRecommendation) => r.status === 'COMPLETED'
      );

      // Calculate career readiness score
      const avgMatchScore = certData.data?.stats?.avgMatchScore || 0;
      const avgReadiness = certData.data?.stats?.avgReadinessScore || 0;
      const portfolioScore = portfolioData.data?.stats?.totalProjects
        ? Math.min(portfolioData.data.stats.totalProjects * 10, 30)
        : 0;
      const certScore = completed.length * 15;
      const careerReadinessScore = Math.min(
        Math.round((avgMatchScore * 0.3 + avgReadiness * 0.3 + portfolioScore + certScore) / 1),
        100
      );

      setData({
        certifications: {
          recommendations: recommendations.slice(0, 3),
          inProgress,
          completed,
          stats: certData.data?.stats || { total: 0, matchScore: 0, readinessScore: 0, inProgressCount: 0 },
        },
        portfolio: {
          projects: portfolioData.data?.projects || [],
          stats: portfolioData.data?.stats || { totalProjects: 0, publicProjects: 0, totalSkills: 0, totalCertifications: 0 },
          settings: portfolioData.data?.settings,
        },
        careerReadinessScore,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load career data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading career progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Career Progress</CardTitle>
              <CardDescription>Certifications, portfolio &amp; readiness</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Career Readiness Score */}
        {data && <CareerReadinessGauge score={data.careerReadinessScore} />}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard
            icon={Award}
            label="Certs"
            value={data?.certifications.completed.length || 0}
            subtext={data?.certifications.inProgress.length ? `${data.certifications.inProgress.length} in progress` : undefined}
          />
          <StatCard
            icon={FolderOpen}
            label="Projects"
            value={data?.portfolio.stats.totalProjects || 0}
          />
          <StatCard
            icon={Zap}
            label="Skills"
            value={data?.portfolio.stats.totalSkills || 0}
          />
          <StatCard
            icon={Target}
            label="Readiness"
            value={`${data?.careerReadinessScore || 0}%`}
          />
        </div>

        {/* In-Progress Certifications */}
        {data?.certifications.inProgress && data.certifications.inProgress.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Active Certifications
                <Badge variant="secondary" className="text-xs">
                  {data.certifications.inProgress.length}
                </Badge>
              </h4>
              {onViewCertifications && (
                <Button variant="ghost" size="sm" onClick={onViewCertifications}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {data.certifications.inProgress.slice(0, compact ? 1 : 2).map((cert) => (
                <CertificationCard key={cert.id} cert={cert} showProgress />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Certifications */}
        {!compact && data?.certifications.recommendations && data.certifications.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Recommended Certifications
            </h4>
            <div className="space-y-2">
              {data.certifications.recommendations
                .filter((c) => c.status === 'NOT_STARTED')
                .slice(0, 2)
                .map((cert) => (
                  <CertificationCard key={cert.id} cert={cert} />
                ))}
            </div>
          </div>
        )}

        {/* Portfolio Projects */}
        {data?.portfolio.projects && data.portfolio.projects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-green-500" />
                Portfolio Projects
                <Badge variant="secondary" className="text-xs">
                  {data.portfolio.stats.totalProjects}
                </Badge>
              </h4>
              <div className="flex gap-1">
                {onAddProject && (
                  <Button variant="ghost" size="sm" onClick={onAddProject}>
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                {onViewPortfolio && (
                  <Button variant="ghost" size="sm" onClick={onViewPortfolio}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {data.portfolio.projects.slice(0, compact ? 2 : 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state for new users */}
        {data && data.certifications.completed.length === 0 && data.portfolio.stats.totalProjects === 0 && (
          <div className="text-center py-6 px-4 rounded-xl bg-muted/30">
            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Start Your Career Journey</p>
            <p className="text-xs text-muted-foreground mb-3">
              Add certifications and projects to build your professional profile
            </p>
            <div className="flex gap-2 justify-center">
              {onViewCertifications && (
                <Button variant="outline" size="sm" onClick={onViewCertifications}>
                  <Award className="w-4 h-4 mr-2" />
                  Browse Certifications
                </Button>
              )}
              {onAddProject && (
                <Button variant="outline" size="sm" onClick={onAddProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Last updated */}
        {data?.lastUpdated && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Updated {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CareerProgressWidget;
